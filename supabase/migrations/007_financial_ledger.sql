-- Munaffa recorded financial ledger.
-- Financial entries are append-only business events; corrections are represented by voiding,
-- never by rewriting an amount, category, tenant identity or timestamp.

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  direction text not null check (direction in ('revenue','expense')),
  category text not null check (char_length(trim(category)) between 1 and 80),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  source text not null default 'manual' check (source in ('manual','pos','pms','payment','accounting','delivery','other')),
  external_reference text not null default '' check (char_length(external_reference) <= 200),
  note text not null default '' check (char_length(note) <= 1000),
  occurred_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','voided')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  voided_by uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'active' and voided_by is null and voided_at is null) or (status = 'voided' and voided_by is not null and voided_at is not null))
);

create index if not exists idx_financial_entries_org_property_occurred
  on public.financial_entries(organization_id, property_id, occurred_at desc);
create index if not exists idx_financial_entries_active_period
  on public.financial_entries(organization_id, property_id, direction, occurred_at desc)
  where status = 'active';

alter table public.financial_entries enable row level security;

create policy "financial_entries_read_finance_roles" on public.financial_entries
  for select using (
    public.has_org_role(organization_id, array['owner','manager','cashier'])
    and public.property_belongs_to_org(property_id, organization_id)
  );

create policy "financial_entries_insert_finance_roles" on public.financial_entries
  for insert with check (
    public.has_org_role(organization_id, array['owner','manager','cashier'])
    and public.property_belongs_to_org(property_id, organization_id)
    and created_by = auth.uid()
    and status = 'active'
    and voided_by is null
    and voided_at is null
  );

create policy "financial_entries_void_management" on public.financial_entries
  for update using (
    public.has_org_role(organization_id, array['owner','manager'])
    and public.property_belongs_to_org(property_id, organization_id)
  ) with check (
    public.has_org_role(organization_id, array['owner','manager'])
    and public.property_belongs_to_org(property_id, organization_id)
  );

create or replace function public.protect_financial_entry_audit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.property_id is distinct from old.property_id
    or new.direction is distinct from old.direction
    or new.category is distinct from old.category
    or new.amount is distinct from old.amount
    or new.currency is distinct from old.currency
    or new.source is distinct from old.source
    or new.external_reference is distinct from old.external_reference
    or new.note is distinct from old.note
    or new.occurred_at is distinct from old.occurred_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Financial audit fields are immutable. Void the entry and create a correction instead.';
  end if;

  if old.status = 'voided' then
    raise exception 'Voided financial entries cannot be changed.';
  end if;

  if new.status = 'active' then
    new.voided_by := null;
    new.voided_at := null;
    return new;
  end if;

  if new.status = 'voided' then
    new.voided_by := auth.uid();
    new.voided_at := now();
    return new;
  end if;

  raise exception 'Invalid financial entry status transition.';
end;
$$;

drop trigger if exists trg_financial_entry_audit on public.financial_entries;
create trigger trg_financial_entry_audit
before update on public.financial_entries
for each row execute function public.protect_financial_entry_audit();
