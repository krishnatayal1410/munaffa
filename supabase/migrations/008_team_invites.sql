-- Munaffa team onboarding and membership management.
-- Invite secrets are never stored in plaintext: only a SHA-256 hash is persisted.

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('manager','front-desk','cashier','waiter','kitchen','inventory')),
  email text,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (email is null or char_length(email) between 3 and 320),
  check (accepted_at is null or accepted_by is not null),
  check (revoked_at is null or revoked_by is not null)
);

create index if not exists idx_organization_invites_org_created
  on public.organization_invites(organization_id, created_at desc);
create index if not exists idx_organization_invites_pending
  on public.organization_invites(organization_id, expires_at)
  where accepted_at is null and revoked_at is null;

alter table public.organization_invites enable row level security;

create policy "organization_invites_read_management" on public.organization_invites
  for select using (public.is_org_manager(organization_id));

create or replace function public.can_manage_member_profile(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members target
    join public.organization_members actor
      on actor.organization_id = target.organization_id
    where target.user_id = p_user_id
      and actor.user_id = auth.uid()
      and actor.role in ('owner','manager')
  );
$$;

revoke all on function public.can_manage_member_profile(uuid) from public;
grant execute on function public.can_manage_member_profile(uuid) to authenticated;

create policy "profiles_read_managed_members" on public.user_profiles
  for select using (public.can_manage_member_profile(id));

create or replace function public.create_organization_invite(
  p_role text,
  p_email text default null,
  p_expires_hours integer default 168
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_actor_role text;
  v_token text;
  v_hash text;
  v_invite_id uuid;
  v_expires_at timestamptz;
  v_email text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_role not in ('manager','front-desk','cashier','waiter','kitchen','inventory') then raise exception 'Invalid invite role'; end if;
  if p_expires_hours < 1 or p_expires_hours > 720 then raise exception 'Invite expiry must be between 1 and 720 hours'; end if;

  select organization_id, role into v_org_id, v_actor_role
  from public.organization_members
  where user_id = v_user_id
  limit 1;

  if v_org_id is null or v_actor_role not in ('owner','manager') then raise exception 'Only owners or managers can create invites'; end if;
  if p_role = 'manager' and v_actor_role <> 'owner' then raise exception 'Only an owner can invite another manager'; end if;

  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  if v_email is not null and (char_length(v_email) < 3 or char_length(v_email) > 320 or position('@' in v_email) = 0) then
    raise exception 'Invalid invite email';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires_at := now() + make_interval(hours => p_expires_hours);

  insert into public.organization_invites (organization_id, role, email, token_hash, expires_at, created_by)
  values (v_org_id, p_role, v_email, v_hash, v_expires_at, v_user_id)
  returning id into v_invite_id;

  return jsonb_build_object(
    'id', v_invite_id,
    'token', v_token,
    'role', p_role,
    'email', v_email,
    'expires_at', v_expires_at
  );
end;
$$;

create or replace function public.accept_organization_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_full_name text;
  v_hash text;
  v_invite public.organization_invites%rowtype;
  v_existing_org uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_token is null or char_length(trim(p_token)) < 32 then raise exception 'Invalid invite token'; end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select * into v_invite
  from public.organization_invites
  where token_hash = v_hash
    and accepted_at is null
    and revoked_at is null
  for update;

  if v_invite.id is null then raise exception 'Invite is invalid, already used or revoked'; end if;
  if v_invite.expires_at <= now() then raise exception 'Invite has expired'; end if;

  select lower(email), coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), '')
    into v_user_email, v_full_name
  from auth.users
  where id = v_user_id;

  if v_invite.email is not null and v_invite.email <> v_user_email then
    raise exception 'This invite is restricted to a different email address';
  end if;

  select organization_id into v_existing_org
  from public.organization_members
  where user_id = v_user_id
  limit 1;

  if v_existing_org is not null and v_existing_org <> v_invite.organization_id then
    raise exception 'This account already belongs to another organization';
  end if;

  if v_existing_org is null then
    insert into public.organization_members (organization_id, user_id, role)
    values (v_invite.organization_id, v_user_id, v_invite.role);
  end if;

  insert into public.user_profiles (id, full_name, primary_role, onboarding_complete, updated_at)
  values (v_user_id, coalesce(v_full_name, ''), v_invite.role, true, now())
  on conflict (id) do update
    set full_name = case when public.user_profiles.full_name = '' then excluded.full_name else public.user_profiles.full_name end,
        primary_role = excluded.primary_role,
        onboarding_complete = true,
        updated_at = now();

  update public.organization_invites
    set accepted_at = now(), accepted_by = v_user_id
  where id = v_invite.id;

  return jsonb_build_object('organization_id', v_invite.organization_id, 'role', v_invite.role, 'accepted', true);
end;
$$;

create or replace function public.revoke_organization_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_actor_role text;
  v_invite_role text;
  v_org_id uuid;
begin
  select organization_id, role into v_org_id, v_invite_role
  from public.organization_invites
  where id = p_invite_id and accepted_at is null and revoked_at is null;
  if v_org_id is null then raise exception 'Pending invite not found'; end if;

  select role into v_actor_role from public.organization_members where organization_id = v_org_id and user_id = v_user_id;
  if v_actor_role not in ('owner','manager') then raise exception 'Not authorized to revoke this invite'; end if;
  if v_invite_role = 'manager' and v_actor_role <> 'owner' then raise exception 'Only an owner can revoke a manager invite'; end if;

  update public.organization_invites set revoked_at = now(), revoked_by = v_user_id where id = p_invite_id;
end;
$$;

create or replace function public.update_organization_member_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_org_id uuid;
  v_actor_role text;
  v_target_role text;
begin
  if p_role not in ('manager','front-desk','cashier','waiter','kitchen','inventory') then raise exception 'Invalid member role'; end if;

  select organization_id, role into v_org_id, v_actor_role
  from public.organization_members where user_id = v_actor_id limit 1;
  if v_org_id is null or v_actor_role not in ('owner','manager') then raise exception 'Not authorized to manage team roles'; end if;

  select role into v_target_role
  from public.organization_members where organization_id = v_org_id and user_id = p_user_id;
  if v_target_role is null then raise exception 'Member not found'; end if;
  if v_target_role = 'owner' then raise exception 'Organization owner role cannot be changed here'; end if;
  if (v_target_role = 'manager' or p_role = 'manager') and v_actor_role <> 'owner' then raise exception 'Only an owner can manage manager roles'; end if;

  update public.organization_members set role = p_role where organization_id = v_org_id and user_id = p_user_id;
  update public.user_profiles set primary_role = p_role, updated_at = now() where id = p_user_id;
end;
$$;

create or replace function public.remove_organization_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_org_id uuid;
  v_actor_role text;
  v_target_role text;
begin
  if p_user_id = v_actor_id then raise exception 'Use account/organization settings for self-removal'; end if;

  select organization_id, role into v_org_id, v_actor_role
  from public.organization_members where user_id = v_actor_id limit 1;
  if v_org_id is null or v_actor_role not in ('owner','manager') then raise exception 'Not authorized to remove team members'; end if;

  select role into v_target_role
  from public.organization_members where organization_id = v_org_id and user_id = p_user_id;
  if v_target_role is null then raise exception 'Member not found'; end if;
  if v_target_role = 'owner' then raise exception 'Organization owner cannot be removed'; end if;
  if v_target_role = 'manager' and v_actor_role <> 'owner' then raise exception 'Only an owner can remove a manager'; end if;

  delete from public.organization_members where organization_id = v_org_id and user_id = p_user_id;
end;
$$;

revoke all on function public.create_organization_invite(text,text,integer) from public;
revoke all on function public.accept_organization_invite(text) from public;
revoke all on function public.revoke_organization_invite(uuid) from public;
revoke all on function public.update_organization_member_role(uuid,text) from public;
revoke all on function public.remove_organization_member(uuid) from public;

grant execute on function public.create_organization_invite(text,text,integer) to authenticated;
grant execute on function public.accept_organization_invite(text) to authenticated;
grant execute on function public.revoke_organization_invite(uuid) to authenticated;
grant execute on function public.update_organization_member_role(uuid,text) to authenticated;
grant execute on function public.remove_organization_member(uuid) to authenticated;
