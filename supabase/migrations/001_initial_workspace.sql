-- Munaffa production workspace schema
-- Apply this migration in a Supabase project before enabling production mode.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  hospitality_type text not null check (hospitality_type in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other')),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','front-desk','cashier','waiter','kitchen','inventory')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  unique (user_id)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  city text not null check (char_length(city) between 2 and 120),
  hospitality_type text not null check (hospitalality_type is null) deferrable initially deferred
);

-- Replace the temporary compatibility column constraint above with the intended one.
alter table public.properties drop constraint if exists properties_hospitality_type_check;
alter table public.properties
  add constraint properties_hospitality_type_check
  check (hospitality_type in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other'));

alter table public.properties
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.workspace_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  enabled_modules text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.properties enable row level security;
alter table public.workspace_settings enable row level security;

create policy "profiles_read_own" on public.user_profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.user_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.user_profiles
  for insert with check (id = auth.uid());

create policy "organizations_read_member" on public.organizations
  for select using (
    owner_user_id = auth.uid() or exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id and m.user_id = auth.uid()
    )
  );
create policy "organizations_insert_owner" on public.organizations
  for insert with check (owner_user_id = auth.uid());
create policy "organizations_update_owner" on public.organizations
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "members_read_related" on public.organization_members
  for select using (
    user_id = auth.uid() or exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id and o.owner_user_id = auth.uid()
    )
  );

create policy "properties_read_member" on public.properties
  for select using (exists (
    select 1 from public.organization_members m
    where m.organization_id = properties.organization_id and m.user_id = auth.uid()
  ));
create policy "properties_write_management" on public.properties
  for all using (exists (
    select 1 from public.organization_members m
    where m.organization_id = properties.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  )) with check (exists (
    select 1 from public.organization_members m
    where m.organization_id = properties.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  ));

create policy "settings_read_member" on public.workspace_settings
  for select using (exists (
    select 1 from public.organization_members m
    where m.organization_id = workspace_settings.organization_id and m.user_id = auth.uid()
  ));
create policy "settings_write_management" on public.workspace_settings
  for all using (exists (
    select 1 from public.organization_members m
    where m.organization_id = workspace_settings.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  )) with check (exists (
    select 1 from public.organization_members m
    where m.organization_id = workspace_settings.organization_id
      and m.user_id = auth.uid()
      and m.role in ('owner','manager')
  ));

create or replace function public.complete_onboarding(
  p_organization_name text,
  p_hospitality_type text,
  p_role text,
  p_property_name text,
  p_city text,
  p_enabled_modules text[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_property_id uuid;
  v_full_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_hospitality_type not in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other') then
    raise exception 'Invalid hospitality type';
  end if;

  if p_role not in ('owner','manager','front-desk','cashier','waiter','kitchen','inventory') then
    raise exception 'Invalid role';
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), '')
    into v_full_name
    from auth.users
    where id = v_user_id;

  insert into public.user_profiles (id, full_name, onboarding_complete, updated_at)
  values (v_user_id, coalesce(v_full_name, ''), true, now())
  on conflict (id) do update
    set full_name = excluded.full_name,
        onboarding_complete = true,
        updated_at = now();

  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id
  order by created_at asc
  limit 1;

  if v_org_id is null then
    insert into public.organizations (name, hospitality_type, owner_user_id)
    values (trim(p_organization_name), p_hospitality_type, v_user_id)
    returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, v_user_id, p_role);
  else
    update public.organizations
      set name = trim(p_organization_name),
          hospitality_type = p_hospitality_type,
          updated_at = now()
      where id = v_org_id and owner_user_id = v_user_id;

    update public.organization_members
      set role = p_role
      where organization_id = v_org_id and user_id = v_user_id;
  end if;

  select id into v_property_id
  from public.properties
  where organization_id = v_org_id
  order by created_at asc
  limit 1;

  if v_property_id is null then
    insert into public.properties (organization_id, name, city, hospitality_type)
    values (v_org_id, trim(p_property_name), trim(p_city), p_hospitality_type)
    returning id into v_property_id;
  else
    update public.properties
      set name = trim(p_property_name),
          city = trim(p_city),
          hospitality_type = p_hospitality_type
      where id = v_property_id;
  end if;

  insert into public.workspace_settings (organization_id, enabled_modules, updated_at)
  values (v_org_id, coalesce(p_enabled_modules, '{}'), now())
  on conflict (organization_id) do update
    set enabled_modules = excluded.enabled_modules,
        updated_at = now();

  return jsonb_build_object(
    'organization_id', v_org_id,
    'property_id', v_property_id,
    'onboarding_complete', true
  );
end;
$$;

create or replace function public.get_workspace_context()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'organization_name', o.name,
    'hospitality_type', o.hospitality_type,
    'role', m.role,
    'property_name', p.name,
    'city', p.city,
    'enabled_modules', coalesce(s.enabled_modules, '{}')
  )
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  left join lateral (
    select p1.* from public.properties p1
    where p1.organization_id = o.id
    order by p1.created_at asc
    limit 1
  ) p on true
  left join public.workspace_settings s on s.organization_id = o.id
  where m.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.complete_onboarding(text,text,text,text,text,text[]) to authenticated;
grant execute on function public.get_workspace_context() to authenticated;
