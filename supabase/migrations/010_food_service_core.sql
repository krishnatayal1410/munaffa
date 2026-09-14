-- Munaffa F&B operating core.
-- Connects menu -> recipe -> order -> append-only theoretical ingredient usage.
-- Physical stock counts remain independent audit observations.

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.recipe_lines (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_per_item numeric(14,3) not null check (quantity_per_item > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (menu_item_id, inventory_item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  service_type text not null check (service_type in ('dine_in','room_service','counter','takeaway','delivery','other')),
  service_reference text not null default '' check (char_length(service_reference) <= 120),
  notes text not null default '' check (char_length(notes) <= 1000),
  status text not null default 'new' check (status in ('new','accepted','preparing','ready','served','completed','cancelled')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  item_name text not null check (char_length(trim(item_name)) between 1 and 160),
  quantity integer not null check (quantity between 1 and 50),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  movement_type text not null check (movement_type in ('order_usage','purchase','waste','manual_adjustment','transfer')),
  source_order_id uuid references public.orders(id) on delete restrict,
  note text not null default '' check (char_length(note) <= 500),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (source_order_id, inventory_item_id)
);

create index if not exists idx_menu_categories_property on public.menu_categories(property_id, sort_order);
create index if not exists idx_menu_items_property_active on public.menu_items(property_id, active);
create index if not exists idx_recipe_lines_inventory on public.recipe_lines(inventory_item_id);
create index if not exists idx_orders_property_status_created on public.orders(property_id, status, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_inventory_movements_item_created on public.inventory_movements(inventory_item_id, created_at desc);
create index if not exists idx_inventory_movements_property on public.inventory_movements(property_id, created_at desc);

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;

create policy "menu_categories_read_member" on public.menu_categories for select using (
  public.is_org_member(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);
create policy "menu_categories_write_management" on public.menu_categories for all using (
  public.is_org_manager(organization_id)
) with check (
  public.is_org_manager(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);

create policy "menu_items_read_member" on public.menu_items for select using (
  public.is_org_member(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);
create policy "menu_items_write_management" on public.menu_items for all using (
  public.is_org_manager(organization_id)
) with check (
  public.is_org_manager(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);

create policy "recipe_lines_read_member" on public.recipe_lines for select using (
  exists (
    select 1 from public.menu_items mi
    where mi.id = recipe_lines.menu_item_id and public.is_org_member(mi.organization_id)
  )
);
create policy "recipe_lines_write_recipe_roles" on public.recipe_lines for all using (
  exists (
    select 1 from public.menu_items mi
    where mi.id = recipe_lines.menu_item_id
      and public.has_org_role(mi.organization_id, array['owner','manager','kitchen','inventory'])
  )
) with check (
  exists (
    select 1 from public.menu_items mi
    join public.inventory_items ii on ii.id = recipe_lines.inventory_item_id
    where mi.id = recipe_lines.menu_item_id
      and mi.organization_id = ii.organization_id
      and mi.property_id = ii.property_id
      and public.has_org_role(mi.organization_id, array['owner','manager','kitchen','inventory'])
  )
);

create policy "orders_read_member" on public.orders for select using (
  public.is_org_member(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);
create policy "order_items_read_member" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and public.is_org_member(o.organization_id)
  )
);
create policy "inventory_movements_read_member" on public.inventory_movements for select using (
  public.is_org_member(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);

create or replace function public.create_staff_order(
  p_property_id uuid,
  p_service_type text,
  p_service_reference text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_quantity integer;
  v_subtotal numeric(14,2) := 0;
  v_count integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_service_type not in ('dine_in','room_service','counter','takeaway','delivery','other') then raise exception 'Invalid service type'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order requires at least one item'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'Too many order lines'; end if;

  select organization_id, role into v_org_id, v_role
  from public.organization_members where user_id = v_user_id limit 1;
  if v_org_id is null or v_role not in ('owner','manager','front-desk','cashier','waiter','kitchen') then raise exception 'Your role cannot create orders'; end if;
  if not public.property_belongs_to_org(p_property_id, v_org_id) then raise exception 'Property not found in your organization'; end if;

  insert into public.orders (organization_id, property_id, service_type, service_reference, notes, created_by)
  values (v_org_id, p_property_id, p_service_type, left(coalesce(trim(p_service_reference), ''), 120), left(coalesce(trim(p_notes), ''), 1000), v_user_id)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity < 1 or v_quantity > 50 then raise exception 'Invalid item quantity'; end if;

    select * into v_menu from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and organization_id = v_org_id
      and property_id = p_property_id
      and active = true;
    if v_menu.id is null then raise exception 'Menu item is invalid or unavailable'; end if;

    insert into public.order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
    values (v_order_id, v_menu.id, v_menu.name, v_quantity, v_menu.price, v_menu.price * v_quantity);
    v_subtotal := v_subtotal + (v_menu.price * v_quantity);
    v_count := v_count + 1;
  end loop;

  update public.orders set subtotal = v_subtotal, updated_at = now() where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'line_count', v_count, 'subtotal', v_subtotal, 'currency', 'INR');
end;
$$;

create or replace function public.set_staff_order_status(p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_role text;
  v_allowed boolean := false;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_status not in ('accepted','preparing','ready','served','completed','cancelled') then raise exception 'Invalid order status'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_order.organization_id and user_id = v_user_id;
  if v_role is null then raise exception 'Workspace membership required'; end if;
  if v_order.status in ('completed','cancelled') then raise exception 'Finalized orders cannot change status'; end if;

  v_allowed := case
    when v_order.status = 'new' then p_status in ('accepted','cancelled')
    when v_order.status = 'accepted' then p_status in ('preparing','ready','cancelled')
    when v_order.status = 'preparing' then p_status in ('ready','cancelled')
    when v_order.status = 'ready' then p_status in ('served','completed')
    when v_order.status = 'served' then p_status = 'completed'
    else false
  end;
  if not v_allowed then raise exception 'Invalid order status transition from % to %', v_order.status, p_status; end if;

  if p_status in ('accepted','preparing','ready') and v_role not in ('owner','manager','kitchen','waiter') then raise exception 'Your role cannot move an order to this kitchen status'; end if;
  if p_status in ('served','completed') and v_role not in ('owner','manager','front-desk','cashier','waiter') then raise exception 'Your role cannot complete service'; end if;
  if p_status = 'cancelled' and v_role not in ('owner','manager','front-desk','cashier','waiter') then raise exception 'Your role cannot cancel orders'; end if;

  if p_status = 'completed' then
    insert into public.inventory_movements (
      organization_id, property_id, inventory_item_id, quantity_delta,
      movement_type, source_order_id, note, created_by
    )
    select
      v_order.organization_id,
      v_order.property_id,
      rl.inventory_item_id,
      -sum(rl.quantity_per_item * oi.quantity),
      'order_usage',
      v_order.id,
      'Theoretical recipe consumption from completed order',
      v_user_id
    from public.order_items oi
    join public.recipe_lines rl on rl.menu_item_id = oi.menu_item_id
    join public.inventory_items ii on ii.id = rl.inventory_item_id
    where oi.order_id = v_order.id
      and ii.organization_id = v_order.organization_id
      and ii.property_id = v_order.property_id
    group by rl.inventory_item_id
    on conflict (source_order_id, inventory_item_id) do nothing;
  end if;

  update public.orders
  set status = p_status,
      completed_at = case when p_status = 'completed' then now() else completed_at end,
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object('order_id', v_order.id, 'status', p_status, 'updated', true);
end;
$$;

revoke all on function public.create_staff_order(uuid,text,text,text,jsonb) from public;
revoke all on function public.set_staff_order_status(uuid,text) from public;
grant execute on function public.create_staff_order(uuid,text,text,text,jsonb) to authenticated;
grant execute on function public.set_staff_order_status(uuid,text) to authenticated;
