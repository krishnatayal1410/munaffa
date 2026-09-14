-- Munaffa order billing and manually recorded settlement events.
-- This migration does not integrate or process card/UPI payments. Staff record money
-- actually received; every captured payment creates one linked append-only revenue
-- entry so order settlement and the financial ledger cannot silently diverge.

create table if not exists public.order_bills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  subtotal numeric(14,2) not null check (subtotal >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  service_charge_amount numeric(14,2) not null default 0 check (service_charge_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(14,2) generated always as (subtotal + tax_amount + service_charge_amount - discount_amount) stored,
  status text not null default 'open' check (status in ('open','partially_paid','paid','voided')),
  created_by uuid not null references auth.users(id) on delete restrict,
  paid_at timestamptz,
  voided_by uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_amount <= subtotal + tax_amount + service_charge_amount),
  check ((status = 'voided' and voided_by is not null and voided_at is not null) or status <> 'voided')
);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  bill_id uuid not null references public.order_bills(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('cash','card','upi','bank','other')),
  reference text not null default '' check (char_length(reference) <= 200),
  status text not null default 'captured' check (status in ('captured','voided')),
  financial_entry_id uuid unique references public.financial_entries(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  voided_by uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'captured' and voided_by is null and voided_at is null) or (status = 'voided' and voided_by is not null and voided_at is not null))
);

create index if not exists idx_order_bills_property_created
  on public.order_bills(organization_id, property_id, created_at desc);
create index if not exists idx_order_payments_bill_created
  on public.order_payments(bill_id, created_at desc);
create index if not exists idx_order_payments_property_created
  on public.order_payments(organization_id, property_id, created_at desc);

alter table public.order_bills enable row level security;
alter table public.order_payments enable row level security;

create policy "order_bills_read_finance" on public.order_bills
  for select using (
    public.has_org_role(organization_id, array['owner','manager','cashier'])
    and public.property_belongs_to_org(property_id, organization_id)
  );

create policy "order_payments_read_finance" on public.order_payments
  for select using (
    public.has_org_role(organization_id, array['owner','manager','cashier'])
    and public.property_belongs_to_org(property_id, organization_id)
  );

create or replace function public.upsert_order_bill(
  p_order_id uuid,
  p_tax_amount numeric default 0,
  p_service_charge_amount numeric default 0,
  p_discount_amount numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_role text;
  v_bill public.order_bills%rowtype;
  v_payment_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(p_tax_amount,0) < 0 or coalesce(p_service_charge_amount,0) < 0 or coalesce(p_discount_amount,0) < 0 then
    raise exception 'Bill adjustments cannot be negative';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.status = 'cancelled' then raise exception 'Cancelled orders cannot be billed'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_order.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager','cashier') then raise exception 'Only finance roles can create an order bill'; end if;

  if coalesce(p_discount_amount,0) > v_order.subtotal + coalesce(p_tax_amount,0) + coalesce(p_service_charge_amount,0) then
    raise exception 'Discount exceeds the bill before discount';
  end if;

  select * into v_bill from public.order_bills where order_id = v_order.id for update;

  if v_bill.id is null then
    insert into public.order_bills (
      organization_id, property_id, order_id, subtotal, tax_amount,
      service_charge_amount, discount_amount, created_by
    ) values (
      v_order.organization_id, v_order.property_id, v_order.id, v_order.subtotal,
      coalesce(p_tax_amount,0), coalesce(p_service_charge_amount,0), coalesce(p_discount_amount,0), v_user_id
    ) returning * into v_bill;
  else
    if v_bill.status = 'voided' then raise exception 'Voided bills cannot be changed'; end if;
    select count(*) into v_payment_count from public.order_payments where bill_id = v_bill.id and status = 'captured';
    if v_payment_count > 0 then raise exception 'Bill amounts are locked after the first payment is recorded'; end if;

    update public.order_bills
    set subtotal = v_order.subtotal,
        tax_amount = coalesce(p_tax_amount,0),
        service_charge_amount = coalesce(p_service_charge_amount,0),
        discount_amount = coalesce(p_discount_amount,0),
        updated_at = now()
    where id = v_bill.id
    returning * into v_bill;
  end if;

  return jsonb_build_object(
    'id', v_bill.id,
    'order_id', v_bill.order_id,
    'subtotal', v_bill.subtotal,
    'tax_amount', v_bill.tax_amount,
    'service_charge_amount', v_bill.service_charge_amount,
    'discount_amount', v_bill.discount_amount,
    'total_amount', v_bill.total_amount,
    'status', v_bill.status,
    'created_at', v_bill.created_at
  );
end;
$$;

create or replace function public.record_order_payment(
  p_bill_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bill public.order_bills%rowtype;
  v_order public.orders%rowtype;
  v_role text;
  v_paid numeric(14,2);
  v_remaining numeric(14,2);
  v_payment_id uuid;
  v_financial_id uuid;
  v_new_paid numeric(14,2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if p_method not in ('cash','card','upi','bank','other') then raise exception 'Invalid payment method'; end if;
  if char_length(coalesce(p_reference,'')) > 200 then raise exception 'Payment reference is too long'; end if;

  select * into v_bill from public.order_bills where id = p_bill_id for update;
  if v_bill.id is null then raise exception 'Bill not found'; end if;
  if v_bill.status in ('paid','voided') then raise exception 'This bill cannot accept another payment'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_bill.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager','cashier') then raise exception 'Only finance roles can record payments'; end if;

  select * into v_order from public.orders where id = v_bill.order_id;
  select coalesce(sum(amount),0) into v_paid from public.order_payments where bill_id = v_bill.id and status = 'captured';
  v_remaining := v_bill.total_amount - v_paid;
  if p_amount > v_remaining then raise exception 'Payment exceeds the remaining bill amount'; end if;

  insert into public.order_payments (
    organization_id, property_id, bill_id, order_id, amount, method, reference, created_by
  ) values (
    v_bill.organization_id, v_bill.property_id, v_bill.id, v_bill.order_id,
    p_amount, p_method, trim(coalesce(p_reference,'')), v_user_id
  ) returning id into v_payment_id;

  insert into public.financial_entries (
    organization_id, property_id, direction, category, amount, currency,
    source, external_reference, note, occurred_at, created_by
  ) values (
    v_bill.organization_id, v_bill.property_id, 'revenue', 'Order payment', p_amount, 'INR',
    'payment', 'order-payment:' || v_payment_id::text,
    'Recorded settlement for order ' || v_bill.order_id::text || case when v_order.service_reference <> '' then ' · ' || v_order.service_reference else '' end,
    now(), v_user_id
  ) returning id into v_financial_id;

  update public.order_payments set financial_entry_id = v_financial_id where id = v_payment_id;

  v_new_paid := v_paid + p_amount;
  update public.order_bills
  set status = case when v_new_paid = total_amount then 'paid' else 'partially_paid' end,
      paid_at = case when v_new_paid = total_amount then now() else null end,
      updated_at = now()
  where id = v_bill.id;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'financial_entry_id', v_financial_id,
    'bill_id', v_bill.id,
    'amount', p_amount,
    'method', p_method,
    'paid_total', v_new_paid,
    'remaining', v_bill.total_amount - v_new_paid,
    'bill_status', case when v_new_paid = v_bill.total_amount then 'paid' else 'partially_paid' end
  );
end;
$$;

create or replace function public.void_order_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment public.order_payments%rowtype;
  v_bill public.order_bills%rowtype;
  v_role text;
  v_paid numeric(14,2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_payment from public.order_payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'Payment not found'; end if;
  if v_payment.status = 'voided' then raise exception 'Payment is already voided'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_payment.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager') then raise exception 'Only owners or managers can void a recorded payment'; end if;

  update public.order_payments
  set status = 'voided', voided_by = v_user_id, voided_at = now()
  where id = v_payment.id;

  if v_payment.financial_entry_id is not null then
    update public.financial_entries set status = 'voided' where id = v_payment.financial_entry_id;
  end if;

  select * into v_bill from public.order_bills where id = v_payment.bill_id for update;
  select coalesce(sum(amount),0) into v_paid from public.order_payments where bill_id = v_bill.id and status = 'captured';

  update public.order_bills
  set status = case when v_paid = 0 then 'open' when v_paid >= total_amount then 'paid' else 'partially_paid' end,
      paid_at = case when v_paid >= total_amount then coalesce(paid_at, now()) else null end,
      updated_at = now()
  where id = v_bill.id;
end;
$$;

create or replace function public.void_order_bill(p_bill_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bill public.order_bills%rowtype;
  v_role text;
  v_payment_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_bill from public.order_bills where id = p_bill_id for update;
  if v_bill.id is null then raise exception 'Bill not found'; end if;
  if v_bill.status = 'voided' then raise exception 'Bill is already voided'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_bill.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager') then raise exception 'Only owners or managers can void a bill'; end if;

  select count(*) into v_payment_count from public.order_payments where bill_id = v_bill.id and status = 'captured';
  if v_payment_count > 0 then raise exception 'Void captured payments before voiding the bill'; end if;

  update public.order_bills
  set status = 'voided', voided_by = v_user_id, voided_at = now(), updated_at = now()
  where id = v_bill.id;
end;
$$;

revoke all on function public.upsert_order_bill(uuid,numeric,numeric,numeric) from public;
revoke all on function public.record_order_payment(uuid,numeric,text,text) from public;
revoke all on function public.void_order_payment(uuid) from public;
revoke all on function public.void_order_bill(uuid) from public;
grant execute on function public.upsert_order_bill(uuid,numeric,numeric,numeric) to authenticated;
grant execute on function public.record_order_payment(uuid,numeric,text,text) to authenticated;
grant execute on function public.void_order_payment(uuid) to authenticated;
grant execute on function public.void_order_bill(uuid) to authenticated;
