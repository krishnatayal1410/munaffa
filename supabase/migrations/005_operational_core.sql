-- Munaffa operational core.
-- Adds real multi-tenant primitives for service work, inventory and guest recovery.
-- No sample/demo records are inserted by this migration.

create or replace function public.has_org_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.role = any(p_roles)
  );
$$;

create or replace function public.property_belongs_to_org(p_property_id uuid, p_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.organization_id = p_organization_id
  );
$$;

revoke all on function public.has_org_role(uuid,text[]) from public;
revoke all on function public.property_belongs_to_org(uuid,uuid) from public;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;
grant execute on function public.property_belongs_to_org(uuid,uuid) to authenticated;

create table if not exists public.operational_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  area text not null check (char_length(trim(area)) between 1 and 120),
  title text not null check (char_length(trim(title)) between 2 and 160),
  detail text not null default '' check (char_length(detail) <= 1000),
  status text not null default 'queued' check (status in ('queued','in_progress','complete','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'complete' or completed_at is not null)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  unit text not null check (char_length(trim(unit)) between 1 and 24),
  theoretical_quantity numeric(14,3) not null default 0 check (theoretical_quantity >= 0),
  reorder_quantity numeric(14,3) not null default 0 check (reorder_quantity >= 0),
  unit_cost numeric(14,2) check (unit_cost is null or unit_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  physical_quantity numeric(14,3) not null check (physical_quantity >= 0),
  counted_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  note text not null default '' check (char_length(note) <= 500),
  counted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_reference text not null default '' check (char_length(guest_reference) <= 160),
  source text not null default 'direct' check (char_length(source) between 1 and 80),
  rating smallint check (rating is null or rating between 1 and 5),
  note text not null check (char_length(trim(note)) between 1 and 2000),
  recovery_status text not null default 'open' check (recovery_status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recovery_status not in ('resolved','closed') or resolved_at is not null)
);

-- Keep tenant and authorship identity immutable while automatically maintaining lifecycle timestamps.
create or replace function public.maintain_operational_task()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.organization_id <> old.organization_id
      or new.property_id <> old.property_id
      or new.created_by <> old.created_by then
      raise exception 'Task tenant and creator identity are immutable';
    end if;
  end if;

  if new.status = 'complete' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.maintain_inventory_item()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.organization_id <> old.organization_id
    or new.property_id <> old.property_id
  ) then
    raise exception 'Inventory item tenant identity is immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.maintain_guest_feedback()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.organization_id <> old.organization_id
      or new.property_id <> old.property_id
      or new.created_by <> old.created_by then
      raise exception 'Feedback tenant and creator identity are immutable';
    end if;
  end if;

  if new.recovery_status in ('resolved','closed') then
    new.resolved_at := coalesce(new.resolved_at, now());
  else
    new.resolved_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_operational_task_lifecycle on public.operational_tasks;
create trigger trg_operational_task_lifecycle
before insert or update on public.operational_tasks
for each row execute function public.maintain_operational_task();

drop trigger if exists trg_inventory_item_updated_at on public.inventory_items;
create trigger trg_inventory_item_updated_at
before update on public.inventory_items
for each row execute function public.maintain_inventory_item();

drop trigger if exists trg_guest_feedback_lifecycle on public.guest_feedback;
create trigger trg_guest_feedback_lifecycle
before insert or update on public.guest_feedback
for each row execute function public.maintain_guest_feedback();

create index if not exists idx_operational_tasks_org_property_status
  on public.operational_tasks(organization_id, property_id, status);
create index if not exists idx_operational_tasks_assigned_to
  on public.operational_tasks(assigned_to) where assigned_to is not null;
create index if not exists idx_inventory_items_org_property
  on public.inventory_items(organization_id, property_id) where active;
create index if not exists idx_inventory_counts_item_counted_at
  on public.inventory_counts(inventory_item_id, counted_at desc);
create index if not exists idx_inventory_counts_org_property
  on public.inventory_counts(organization_id, property_id, counted_at desc);
create index if not exists idx_guest_feedback_org_property_status
  on public.guest_feedback(organization_id, property_id, recovery_status);

alter table public.operational_tasks enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_counts enable row level security;
alter table public.guest_feedback enable row level security;

-- Shared operational queue: every organization member may read and operate work,
-- but destructive deletion is reserved for management.
create policy "operational_tasks_read_member" on public.operational_tasks
  for select using (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "operational_tasks_insert_member" on public.operational_tasks
  for insert with check (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
    and created_by = auth.uid()
    and (
      assigned_to is null or exists (
        select 1 from public.organization_members m
        where m.organization_id = operational_tasks.organization_id
          and m.user_id = operational_tasks.assigned_to
      )
    )
  );
create policy "operational_tasks_update_member" on public.operational_tasks
  for update using (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
  ) with check (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
    and (
      assigned_to is null or exists (
        select 1 from public.organization_members m
        where m.organization_id = operational_tasks.organization_id
          and m.user_id = operational_tasks.assigned_to
      )
    )
  );
create policy "operational_tasks_delete_management" on public.operational_tasks
  for delete using (public.is_org_manager(organization_id));

-- Inventory masters and stock counts are restricted to inventory-capable roles.
create policy "inventory_items_read_member" on public.inventory_items
  for select using (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "inventory_items_insert_inventory" on public.inventory_items
  for insert with check (
    public.has_org_role(organization_id, array['owner','manager','inventory'])
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "inventory_items_update_inventory" on public.inventory_items
  for update using (public.has_org_role(organization_id, array['owner','manager','inventory']))
  with check (
    public.has_org_role(organization_id, array['owner','manager','inventory'])
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "inventory_items_delete_management" on public.inventory_items
  for delete using (public.is_org_manager(organization_id));

create policy "inventory_counts_read_member" on public.inventory_counts
  for select using (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "inventory_counts_insert_inventory" on public.inventory_counts
  for insert with check (
    public.has_org_role(organization_id, array['owner','manager','inventory'])
    and public.property_belongs_to_org(property_id, organization_id)
    and counted_by = auth.uid()
    and exists (
      select 1 from public.inventory_items i
      where i.id = inventory_counts.inventory_item_id
        and i.organization_id = inventory_counts.organization_id
        and i.property_id = inventory_counts.property_id
    )
  );
-- Counts are append-only audit events. Corrections create a new count; only management may delete a bad event.
create policy "inventory_counts_delete_management" on public.inventory_counts
  for delete using (public.is_org_manager(organization_id));

-- Feedback is visible to members. Front desk and management can manage recovery state.
create policy "guest_feedback_read_member" on public.guest_feedback
  for select using (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
  );
create policy "guest_feedback_insert_member" on public.guest_feedback
  for insert with check (
    public.is_org_member(organization_id)
    and public.property_belongs_to_org(property_id, organization_id)
    and created_by = auth.uid()
    and (
      assigned_to is null or exists (
        select 1 from public.organization_members m
        where m.organization_id = guest_feedback.organization_id
          and m.user_id = guest_feedback.assigned_to
      )
    )
  );
create policy "guest_feedback_update_recovery" on public.guest_feedback
  for update using (public.has_org_role(organization_id, array['owner','manager','front-desk']))
  with check (
    public.has_org_role(organization_id, array['owner','manager','front-desk'])
    and public.property_belongs_to_org(property_id, organization_id)
    and (
      assigned_to is null or exists (
        select 1 from public.organization_members m
        where m.organization_id = guest_feedback.organization_id
          and m.user_id = guest_feedback.assigned_to
      )
    )
  );
create policy "guest_feedback_delete_management" on public.guest_feedback
  for delete using (public.is_org_manager(organization_id));
