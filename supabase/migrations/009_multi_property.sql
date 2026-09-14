-- Munaffa multi-property / multi-outlet support.
-- Every authenticated member may choose an active property within their organization.
-- Only owner/manager authorization roles may create new properties.

alter table public.user_profiles
  add column if not exists active_property_id uuid references public.properties(id) on delete set null;

create index if not exists idx_user_profiles_active_property
  on public.user_profiles(active_property_id)
  where active_property_id is not null;

create or replace function public.set_active_property(p_property_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_property public.properties%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id
  limit 1;
  if v_org_id is null then raise exception 'Workspace membership required'; end if;

  select * into v_property
  from public.properties
  where id = p_property_id and organization_id = v_org_id;
  if v_property.id is null then raise exception 'Property not found in your organization'; end if;

  insert into public.user_profiles (id, full_name, onboarding_complete, active_property_id, updated_at)
  values (v_user_id, '', true, v_property.id, now())
  on conflict (id) do update
    set active_property_id = excluded.active_property_id,
        updated_at = now();

  return jsonb_build_object(
    'property_id', v_property.id,
    'property_name', v_property.name,
    'city', v_property.city,
    'hospitality_type', v_property.hospitality_type
  );
end;
$$;

create or replace function public.create_workspace_property(
  p_name text,
  p_city text,
  p_hospitality_type text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role text;
  v_property_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name)) not between 2 and 120 then raise exception 'Invalid property name'; end if;
  if char_length(trim(p_city)) not between 2 and 120 then raise exception 'Invalid city'; end if;
  if p_hospitality_type not in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other') then raise exception 'Invalid hospitality type'; end if;

  select organization_id, role into v_org_id, v_role
  from public.organization_members
  where user_id = v_user_id
  limit 1;
  if v_org_id is null or v_role not in ('owner','manager') then raise exception 'Only owners or managers can create properties'; end if;

  insert into public.properties (organization_id, name, city, hospitality_type)
  values (v_org_id, trim(p_name), trim(p_city), p_hospitality_type)
  returning id into v_property_id;

  update public.user_profiles
  set active_property_id = coalesce(active_property_id, v_property_id), updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('property_id', v_property_id, 'created', true);
end;
$$;

create or replace function public.save_workspace_configuration(
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
  v_authorization_role text;
  v_property_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_role not in ('owner','manager','front-desk','cashier','waiter','kitchen','inventory') then raise exception 'Invalid primary role'; end if;

  select organization_id, role into v_org_id, v_authorization_role
  from public.organization_members
  where user_id = v_user_id
  limit 1;
  if v_org_id is null then raise exception 'Workspace membership required'; end if;

  update public.user_profiles
  set primary_role = p_role, updated_at = now()
  where id = v_user_id;

  if v_authorization_role <> 'owner' then
    return jsonb_build_object('organization_id', v_org_id, 'authorization_role', v_authorization_role, 'profile_updated', true);
  end if;

  if char_length(trim(p_organization_name)) not between 2 and 120 then raise exception 'Invalid organization name'; end if;
  if char_length(trim(p_property_name)) not between 2 and 120 then raise exception 'Invalid property name'; end if;
  if char_length(trim(p_city)) not between 2 and 120 then raise exception 'Invalid city'; end if;
  if p_hospitality_type not in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other') then raise exception 'Invalid hospitality type'; end if;

  select up.active_property_id into v_property_id
  from public.user_profiles up
  where up.id = v_user_id;

  if v_property_id is null or not public.property_belongs_to_org(v_property_id, v_org_id) then
    select id into v_property_id
    from public.properties
    where organization_id = v_org_id
    order by created_at asc
    limit 1;
  end if;
  if v_property_id is null then raise exception 'No property is available to update'; end if;

  update public.organizations
  set name = trim(p_organization_name),
      hospitality_type = p_hospitality_type,
      updated_at = now()
  where id = v_org_id and owner_user_id = v_user_id;

  update public.properties
  set name = trim(p_property_name),
      city = trim(p_city),
      hospitality_type = p_hospitality_type,
      updated_at = now()
  where id = v_property_id and organization_id = v_org_id;

  insert into public.workspace_settings (organization_id, enabled_modules, updated_at)
  values (v_org_id, coalesce(p_enabled_modules, '{}'), now())
  on conflict (organization_id) do update
    set enabled_modules = excluded.enabled_modules,
        updated_at = now();

  update public.user_profiles
  set active_property_id = v_property_id, updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'organization_id', v_org_id,
    'property_id', v_property_id,
    'authorization_role', v_authorization_role,
    'updated', true
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
    'organization_id', o.id,
    'organization_name', o.name,
    'hospitality_type', o.hospitality_type,
    'role', coalesce(up.primary_role, m.role),
    'authorization_role', m.role,
    'property_id', p.id,
    'property_name', p.name,
    'city', p.city,
    'enabled_modules', coalesce(s.enabled_modules, '{}')
  )
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  left join public.user_profiles up on up.id = m.user_id
  left join lateral (
    select p1.*
    from public.properties p1
    where p1.organization_id = o.id
    order by case when p1.id = up.active_property_id then 0 else 1 end, p1.created_at asc
    limit 1
  ) p on true
  left join public.workspace_settings s on s.organization_id = o.id
  where m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.set_active_property(uuid) from public;
revoke all on function public.create_workspace_property(text,text,text) from public;
revoke all on function public.save_workspace_configuration(text,text,text,text,text,text[]) from public;
revoke all on function public.get_workspace_context() from public;

grant execute on function public.set_active_property(uuid) to authenticated;
grant execute on function public.create_workspace_property(text,text,text) to authenticated;
grant execute on function public.save_workspace_configuration(text,text,text,text,text,text[]) to authenticated;
grant execute on function public.get_workspace_context() to authenticated;
