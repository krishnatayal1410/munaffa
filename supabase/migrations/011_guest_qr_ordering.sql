-- Munaffa app-free guest ordering.
-- Ordering-point secrets are stored only as SHA-256 hashes. Public guests access
-- menu/order functions through narrowly scoped security-definer RPCs, not tables.

create table if not exists public.ordering_points (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 120),
  service_type text not null check (service_type in ('dine_in','room_service','counter','takeaway','other')),
  token_hash text not null unique,
  active boolean not null default true,
  max_open_orders integer not null default 5 check (max_open_orders between 1 and 20),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, label)
);

create index if not exists idx_ordering_points_property_active
  on public.ordering_points(property_id, active);

alter table public.ordering_points enable row level security;

create policy "ordering_points_read_management" on public.ordering_points
  for select using (public.is_org_manager(organization_id));
create policy "ordering_points_write_management" on public.ordering_points
  for update using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id) and public.property_belongs_to_org(property_id, organization_id));

alter table public.orders alter column created_by drop not null;
alter table public.orders add column if not exists created_via text not null default 'staff'
  check (created_via in ('staff','guest_qr'));
alter table public.orders add column if not exists ordering_point_id uuid references public.ordering_points(id) on delete set null;

create index if not exists idx_orders_ordering_point_open
  on public.orders(ordering_point_id, created_at desc)
  where created_via = 'guest_qr' and status not in ('completed','cancelled');

create or replace function public.create_ordering_point(
  p_property_id uuid,
  p_label text,
  p_service_type text,
  p_max_open_orders integer default 5
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
  v_token text;
  v_hash text;
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_service_type not in ('dine_in','room_service','counter','takeaway','other') then raise exception 'Invalid service type'; end if;
  if p_max_open_orders < 1 or p_max_open_orders > 20 then raise exception 'Open-order limit must be between 1 and 20'; end if;
  if char_length(trim(coalesce(p_label, ''))) < 1 or char_length(trim(p_label)) > 120 then raise exception 'Label must be between 1 and 120 characters'; end if;

  select organization_id, role into v_org_id, v_role
  from public.organization_members
  where user_id = v_user_id
  limit 1;

  if v_org_id is null or v_role not in ('owner','manager') then raise exception 'Only owners or managers can create ordering points'; end if;
  if not public.property_belongs_to_org(p_property_id, v_org_id) then raise exception 'Property not found in your organization'; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.ordering_points (
    organization_id, property_id, label, service_type, token_hash, max_open_orders, created_by
  ) values (
    v_org_id, p_property_id, trim(p_label), p_service_type, v_hash, p_max_open_orders, v_user_id
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'label', trim(p_label),
    'service_type', p_service_type,
    'max_open_orders', p_max_open_orders
  );
end;
$$;

create or replace function public.set_ordering_point_active(p_ordering_point_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
begin
  select organization_id into v_org_id from public.ordering_points where id = p_ordering_point_id;
  if v_org_id is null then raise exception 'Ordering point not found'; end if;
  select role into v_role from public.organization_members where organization_id = v_org_id and user_id = v_user_id;
  if v_role not in ('owner','manager') then raise exception 'Only owners or managers can manage ordering points'; end if;
  update public.ordering_points set active = p_active, updated_at = now() where id = p_ordering_point_id;
end;
$$;

create or replace function public.resolve_guest_ordering_point(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_hash text;
  v_point public.ordering_points%rowtype;
  v_property_name text;
  v_business_name text;
  v_menu jsonb;
begin
  if p_token is null or char_length(trim(p_token)) < 32 then raise exception 'Invalid ordering link'; end if;
  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_point
  from public.ordering_points
  where token_hash = v_hash and active = true;
  if v_point.id is null then raise exception 'Ordering link is invalid or inactive'; end if;

  select p.name, o.name into v_property_name, v_business_name
  from public.properties p
  join public.organizations o on o.id = p.organization_id
  where p.id = v_point.property_id and o.id = v_point.organization_id;

  select coalesce(jsonb_agg(category_payload order by category_sort, category_name), '[]'::jsonb)
    into v_menu
  from (
    select
      coalesce(mc.sort_order, 999999) as category_sort,
      coalesce(mc.name, 'Menu') as category_name,
      jsonb_build_object(
        'id', mc.id,
        'name', coalesce(mc.name, 'Menu'),
        'items', coalesce(jsonb_agg(
          jsonb_build_object(
            'id', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', mi.price,
            'currency', mi.currency
          ) order by mi.name
        ) filter (where mi.id is not null), '[]'::jsonb)
      ) as category_payload
    from public.menu_items mi
    left join public.menu_categories mc on mc.id = mi.category_id and mc.active = true
    where mi.organization_id = v_point.organization_id
      and mi.property_id = v_point.property_id
      and mi.active = true
    group by mc.id, mc.name, mc.sort_order
  ) categories;

  return jsonb_build_object(
    'business_name', v_business_name,
    'property_name', v_property_name,
    'ordering_label', v_point.label,
    'service_type', v_point.service_type,
    'menu', v_menu
  );
end;
$$;

create or replace function public.create_guest_order(
  p_token text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_point public.ordering_points%rowtype;
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_quantity integer;
  v_subtotal numeric(14,2) := 0;
  v_line_count integer := 0;
  v_open_orders integer := 0;
begin
  if p_token is null or char_length(trim(p_token)) < 32 then raise exception 'Invalid ordering link'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order requires at least one item'; end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Too many order lines'; end if;
  if char_length(coalesce(p_notes, '')) > 500 then raise exception 'Order note is too long'; end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');
  select * into v_point
  from public.ordering_points
  where token_hash = v_hash and active = true
  for update;
  if v_point.id is null then raise exception 'Ordering link is invalid or inactive'; end if;

  select count(*) into v_open_orders
  from public.orders
  where ordering_point_id = v_point.id
    and created_via = 'guest_qr'
    and status not in ('completed','cancelled')
    and created_at > now() - interval '6 hours';
  if v_open_orders >= v_point.max_open_orders then
    raise exception 'This ordering point already has too many open orders. Please ask a staff member for help.';
  end if;

  insert into public.orders (
    organization_id, property_id, service_type, service_reference, notes,
    status, subtotal, currency, created_by, created_via, ordering_point_id
  ) values (
    v_point.organization_id, v_point.property_id, v_point.service_type, v_point.label,
    left(coalesce(trim(p_notes), ''), 500), 'new', 0, 'INR', null, 'guest_qr', v_point.id
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity < 1 or v_quantity > 20 then raise exception 'Invalid item quantity'; end if;

    select * into v_menu
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and organization_id = v_point.organization_id
      and property_id = v_point.property_id
      and active = true;
    if v_menu.id is null then raise exception 'Menu item is invalid or unavailable'; end if;

    insert into public.order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
    values (v_order_id, v_menu.id, v_menu.name, v_quantity, v_menu.price, v_menu.price * v_quantity);
    v_subtotal := v_subtotal + (v_menu.price * v_quantity);
    v_line_count := v_line_count + 1;
  end loop;

  if v_subtotal > 1000000 then raise exception 'Order subtotal exceeds the public ordering limit'; end if;

  update public.orders set subtotal = v_subtotal, updated_at = now() where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'status', 'new',
    'line_count', v_line_count,
    'subtotal', v_subtotal,
    'currency', 'INR'
  );
exception
  when others then
    if v_order_id is not null then delete from public.orders where id = v_order_id; end if;
    raise;
end;
$$;

revoke all on function public.create_ordering_point(uuid,text,text,integer) from public;
revoke all on function public.set_ordering_point_active(uuid,boolean) from public;
revoke all on function public.resolve_guest_ordering_point(text) from public;
revoke all on function public.create_guest_order(text,text,jsonb) from public;

grant execute on function public.create_ordering_point(uuid,text,text,integer) to authenticated;
grant execute on function public.set_ordering_point_active(uuid,boolean) to authenticated;
grant execute on function public.resolve_guest_ordering_point(text) to anon, authenticated;
grant execute on function public.create_guest_order(text,text,jsonb) to anon, authenticated;
