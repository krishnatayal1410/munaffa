-- Munaffa supplier purchasing and inventory receiving.
-- Receiving a purchase creates positive inventory movements and one linked expense
-- entry. Voiding a received purchase appends reversing stock movements and voids
-- the linked expense; historical events are not deleted.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  phone text not null default '' check (char_length(phone) <= 40),
  email text not null default '' check (char_length(email) <= 320),
  note text not null default '' check (char_length(note) <= 500),
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete restrict,
  invoice_reference text not null default '' check (char_length(invoice_reference) <= 200),
  note text not null default '' check (char_length(note) <= 1000),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','received','voided')),
  financial_entry_id uuid unique references public.financial_entries(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  received_by uuid references auth.users(id) on delete restrict,
  received_at timestamptz,
  voided_by uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft' and received_by is null and received_at is null and voided_by is null and voided_at is null)
    or (status = 'received' and received_by is not null and received_at is not null and voided_by is null and voided_at is null)
    or (status = 'voided' and voided_by is not null and voided_at is not null))
);

create table if not exists public.purchase_receipt_items (
  id uuid primary key default gen_random_uuid(),
  purchase_receipt_id uuid not null references public.purchase_receipts(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  line_total numeric(14,2) generated always as (round(quantity * unit_cost, 2)) stored,
  created_at timestamptz not null default now(),
  unique (purchase_receipt_id, inventory_item_id)
);

alter table public.inventory_movements add column if not exists source_purchase_id uuid references public.purchase_receipts(id) on delete restrict;
create unique index if not exists uq_inventory_movements_purchase_item
  on public.inventory_movements(source_purchase_id, inventory_item_id)
  where source_purchase_id is not null and movement_type = 'purchase';

create index if not exists idx_suppliers_org_active on public.suppliers(organization_id, active, name);
create index if not exists idx_purchase_receipts_property_created on public.purchase_receipts(property_id, created_at desc);
create index if not exists idx_purchase_receipt_items_receipt on public.purchase_receipt_items(purchase_receipt_id);

alter table public.suppliers enable row level security;
alter table public.purchase_receipts enable row level security;
alter table public.purchase_receipt_items enable row level security;

create policy "suppliers_read_member" on public.suppliers for select using (public.is_org_member(organization_id));
create policy "purchase_receipts_read_member" on public.purchase_receipts for select using (
  public.is_org_member(organization_id) and public.property_belongs_to_org(property_id, organization_id)
);
create policy "purchase_receipt_items_read_member" on public.purchase_receipt_items for select using (
  exists (
    select 1 from public.purchase_receipts pr
    where pr.id = purchase_receipt_items.purchase_receipt_id and public.is_org_member(pr.organization_id)
  )
);

create or replace function public.create_supplier(
  p_name text,
  p_phone text default '',
  p_email text default '',
  p_note text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
  v_supplier_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_name,''))) < 1 or char_length(trim(p_name)) > 160 then raise exception 'Supplier name must be between 1 and 160 characters'; end if;
  if char_length(coalesce(p_phone,'')) > 40 or char_length(coalesce(p_email,'')) > 320 or char_length(coalesce(p_note,'')) > 500 then raise exception 'Supplier contact fields are too long'; end if;

  select organization_id, role into v_org_id, v_role from public.organization_members where user_id = v_user_id limit 1;
  if v_org_id is null or v_role not in ('owner','manager','inventory') then raise exception 'Only owner, manager or inventory roles can create suppliers'; end if;

  insert into public.suppliers (organization_id, name, phone, email, note, created_by)
  values (v_org_id, trim(p_name), trim(coalesce(p_phone,'')), lower(trim(coalesce(p_email,''))), trim(coalesce(p_note,'')), v_user_id)
  returning id into v_supplier_id;
  return v_supplier_id;
end;
$$;

create or replace function public.create_purchase_receipt(
  p_property_id uuid,
  p_supplier_id uuid,
  p_invoice_reference text,
  p_note text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
  v_receipt_id uuid;
  v_item jsonb;
  v_inventory public.inventory_items%rowtype;
  v_quantity numeric(14,3);
  v_unit_cost numeric(14,2);
  v_supplier_org uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Purchase requires at least one inventory item'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Purchase has too many item lines'; end if;
  if char_length(coalesce(p_invoice_reference,'')) > 200 or char_length(coalesce(p_note,'')) > 1000 then raise exception 'Purchase reference or note is too long'; end if;

  select organization_id, role into v_org_id, v_role from public.organization_members where user_id = v_user_id limit 1;
  if v_org_id is null or v_role not in ('owner','manager','inventory') then raise exception 'Only owner, manager or inventory roles can create purchases'; end if;
  if not public.property_belongs_to_org(p_property_id, v_org_id) then raise exception 'Property not found in your organization'; end if;

  if p_supplier_id is not null then
    select organization_id into v_supplier_org from public.suppliers where id = p_supplier_id and active = true;
    if v_supplier_org is distinct from v_org_id then raise exception 'Supplier is not active in your organization'; end if;
  end if;

  insert into public.purchase_receipts (
    organization_id, property_id, supplier_id, invoice_reference, note, created_by
  ) values (
    v_org_id, p_property_id, p_supplier_id, trim(coalesce(p_invoice_reference,'')), trim(coalesce(p_note,'')), v_user_id
  ) returning id into v_receipt_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_cost := coalesce((v_item->>'unit_cost')::numeric, -1);
    if v_quantity <= 0 or v_unit_cost < 0 then raise exception 'Purchase quantities must be positive and unit cost cannot be negative'; end if;

    select * into v_inventory from public.inventory_items
    where id = (v_item->>'inventory_item_id')::uuid
      and organization_id = v_org_id
      and property_id = p_property_id
      and active = true;
    if v_inventory.id is null then raise exception 'Inventory item is invalid or inactive'; end if;

    insert into public.purchase_receipt_items (purchase_receipt_id, inventory_item_id, quantity, unit_cost)
    values (v_receipt_id, v_inventory.id, v_quantity, v_unit_cost);
  end loop;

  return v_receipt_id;
exception
  when others then
    if v_receipt_id is not null then delete from public.purchase_receipts where id = v_receipt_id; end if;
    raise;
end;
$$;

create or replace function public.receive_purchase_receipt(p_purchase_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_receipt public.purchase_receipts%rowtype;
  v_role text;
  v_total numeric(14,2);
  v_line record;
  v_financial_id uuid;
  v_supplier_name text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_receipt from public.purchase_receipts where id = p_purchase_receipt_id for update;
  if v_receipt.id is null then raise exception 'Purchase receipt not found'; end if;
  if v_receipt.status <> 'draft' then raise exception 'Only draft purchases can be received'; end if;

  select role into v_role from public.organization_members where organization_id = v_receipt.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager','inventory') then raise exception 'Only owner, manager or inventory roles can receive purchases'; end if;

  select coalesce(sum(line_total),0) into v_total from public.purchase_receipt_items where purchase_receipt_id = v_receipt.id;
  if v_total <= 0 then raise exception 'Purchase total must be greater than zero before receiving'; end if;

  for v_line in
    select pri.inventory_item_id, pri.quantity
    from public.purchase_receipt_items pri
    where pri.purchase_receipt_id = v_receipt.id
  loop
    insert into public.inventory_movements (
      organization_id, property_id, inventory_item_id, quantity_delta, movement_type,
      source_purchase_id, note, created_by
    ) values (
      v_receipt.organization_id, v_receipt.property_id, v_line.inventory_item_id, v_line.quantity,
      'purchase', v_receipt.id, 'Supplier purchase received', v_user_id
    );
  end loop;

  select name into v_supplier_name from public.suppliers where id = v_receipt.supplier_id;
  insert into public.financial_entries (
    organization_id, property_id, direction, category, amount, currency, source,
    external_reference, note, occurred_at, created_by
  ) values (
    v_receipt.organization_id, v_receipt.property_id, 'expense', 'Inventory purchase', v_total, 'INR', 'other',
    'purchase:' || v_receipt.id::text,
    coalesce(v_supplier_name, 'Supplier purchase') || case when v_receipt.invoice_reference <> '' then ' · ' || v_receipt.invoice_reference else '' end,
    now(), v_user_id
  ) returning id into v_financial_id;

  update public.purchase_receipts
  set total_amount = v_total, status = 'received', financial_entry_id = v_financial_id,
      received_by = v_user_id, received_at = now(), updated_at = now()
  where id = v_receipt.id;

  return jsonb_build_object('id', v_receipt.id, 'total_amount', v_total, 'financial_entry_id', v_financial_id, 'status', 'received');
end;
$$;

create or replace function public.void_purchase_receipt(p_purchase_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_receipt public.purchase_receipts%rowtype;
  v_role text;
  v_line record;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_receipt from public.purchase_receipts where id = p_purchase_receipt_id for update;
  if v_receipt.id is null then raise exception 'Purchase receipt not found'; end if;
  if v_receipt.status = 'voided' then raise exception 'Purchase receipt is already voided'; end if;

  select role into v_role from public.organization_members where organization_id = v_receipt.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager') then raise exception 'Only owners or managers can void a purchase'; end if;

  if v_receipt.status = 'received' then
    for v_line in
      select pri.inventory_item_id, pri.quantity
      from public.purchase_receipt_items pri
      where pri.purchase_receipt_id = v_receipt.id
    loop
      insert into public.inventory_movements (
        organization_id, property_id, inventory_item_id, quantity_delta, movement_type,
        note, created_by
      ) values (
        v_receipt.organization_id, v_receipt.property_id, v_line.inventory_item_id, -v_line.quantity,
        'manual_adjustment', 'Reversal of voided purchase ' || v_receipt.id::text, v_user_id
      );
    end loop;

    if v_receipt.financial_entry_id is not null then
      update public.financial_entries set status = 'voided' where id = v_receipt.financial_entry_id;
    end if;
  end if;

  update public.purchase_receipts
  set status = 'voided', voided_by = v_user_id, voided_at = now(), updated_at = now()
  where id = v_receipt.id;
end;
$$;

revoke all on function public.create_supplier(text,text,text,text) from public;
revoke all on function public.create_purchase_receipt(uuid,uuid,text,text,jsonb) from public;
revoke all on function public.receive_purchase_receipt(uuid) from public;
revoke all on function public.void_purchase_receipt(uuid) from public;
grant execute on function public.create_supplier(text,text,text,text) to authenticated;
grant execute on function public.create_purchase_receipt(uuid,uuid,text,text,jsonb) to authenticated;
grant execute on function public.receive_purchase_receipt(uuid) to authenticated;
grant execute on function public.void_purchase_receipt(uuid) to authenticated;
