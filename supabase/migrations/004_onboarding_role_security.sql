-- Separate a user's preferred operating role from organization authorization.
-- The creator of a new organization is always its RBAC owner.
-- Existing members cannot use onboarding to promote themselves.

alter table public.user_profiles
  add column if not exists primary_role text
  check (primary_role is null or primary_role in ('owner','manager','front-desk','cashier','waiter','kitchen','inventory'));

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
  v_existing_membership_role text;
  v_owner_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(p_organization_name)) not between 2 and 120 then
    raise exception 'Invalid organization name';
  end if;

  if char_length(trim(p_property_name)) not between 2 and 120 then
    raise exception 'Invalid property name';
  end if;

  if char_length(trim(p_city)) not between 2 and 120 then
    raise exception 'Invalid city';
  end if;

  if p_hospitality_type not in ('hotel','restaurant','cafe','qsr','cloud-kitchen','resort','bar-lounge','other') then
    raise exception 'Invalid hospitality type';
  end if;

  if p_role not in ('owner','manager','front-desk','cashier','waiter','kitchen','inventory') then
    raise exception 'Invalid primary role';
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), '')
    into v_full_name
    from auth.users
    where id = v_user_id;

  insert into public.user_profiles (id, full_name, primary_role, onboarding_complete, updated_at)
  values (v_user_id, coalesce(v_full_name, ''), p_role, true, now())
  on conflict (id) do update
    set full_name = excluded.full_name,
        primary_role = excluded.primary_role,
        onboarding_complete = true,
        updated_at = now();

  select m.organization_id, m.role, o.owner_user_id
    into v_org_id, v_existing_membership_role, v_owner_user_id
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = v_user_id
    order by m.created_at asc
    limit 1;

  if v_org_id is null then
    insert into public.organizations (name, hospitality_type, owner_user_id)
    values (trim(p_organization_name), p_hospitality_type, v_user_id)
    returning id into v_org_id;

    -- Authorization owner is not derived from the user's UI preference.
    insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, v_user_id, 'owner');
  elsif v_owner_user_id = v_user_id then
    update public.organizations
      set name = trim(p_organization_name),
          hospitality_type = p_hospitality_type,
          updated_at = now()
      where id = v_org_id;
  else
    -- Invited/existing non-owner members may update their profile preference above,
    -- but onboarding cannot mutate organization identity or authorization roles.
    return jsonb_build_object(
      'organization_id', v_org_id,
      'property_id', null,
      'onboarding_complete', true,
      'authorization_role', v_existing_membership_role
    );
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
          hospitality_type = p_hospitality_type,
          updated_at = now()
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
    'onboarding_complete', true,
    'authorization_role', 'owner'
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
    'role', coalesce(up.primary_role, m.role),
    'authorization_role', m.role,
    'property_name', p.name,
    'city', p.city,
    'enabled_modules', coalesce(s.enabled_modules, '{}')
  )
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  left join public.user_profiles up on up.id = m.user_id
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

revoke all on function public.complete_onboarding(text,text,text,text,text,text[]) from public;
revoke all on function public.get_workspace_context() from public;
grant execute on function public.complete_onboarding(text,text,text,text,text,text[]) to authenticated;
grant execute on function public.get_workspace_context() to authenticated;
