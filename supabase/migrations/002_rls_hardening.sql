-- Munaffa workspace access hardening.
-- Removes policy-to-policy recursion and adds lookup indexes used by RLS/RPCs.

create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);
create index if not exists idx_organization_members_org_role
  on public.organization_members(organization_id, role);
create index if not exists idx_properties_organization_id
  on public.properties(organization_id);
create index if not exists idx_organizations_owner_user_id
  on public.organizations(owner_user_id);

create or replace function public.is_org_member(p_organization_id uuid)
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
  );
$$;

create or replace function public.is_org_manager(p_organization_id uuid)
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
      and m.role in ('owner', 'manager')
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_manager(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_manager(uuid) to authenticated;

drop policy if exists "organizations_read_member" on public.organizations;
drop policy if exists "organizations_insert_owner" on public.organizations;
drop policy if exists "organizations_update_owner" on public.organizations;
drop policy if exists "members_read_related" on public.organization_members;
drop policy if exists "properties_read_member" on public.properties;
drop policy if exists "properties_write_management" on public.properties;
drop policy if exists "settings_read_member" on public.workspace_settings;
drop policy if exists "settings_write_management" on public.workspace_settings;

create policy "organizations_read_member" on public.organizations
  for select using (
    owner_user_id = auth.uid() or public.is_org_member(id)
  );

create policy "organizations_insert_owner" on public.organizations
  for insert with check (owner_user_id = auth.uid());

create policy "organizations_update_owner" on public.organizations
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "members_read_related" on public.organization_members
  for select using (
    user_id = auth.uid() or public.is_org_manager(organization_id)
  );

create policy "properties_read_member" on public.properties
  for select using (public.is_org_member(organization_id));

create policy "properties_insert_management" on public.properties
  for insert with check (public.is_org_manager(organization_id));

create policy "properties_update_management" on public.properties
  for update using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "properties_delete_management" on public.properties
  for delete using (public.is_org_manager(organization_id));

create policy "settings_read_member" on public.workspace_settings
  for select using (public.is_org_member(organization_id));

create policy "settings_insert_management" on public.workspace_settings
  for insert with check (public.is_org_manager(organization_id));

create policy "settings_update_management" on public.workspace_settings
  for update using (public.is_org_manager(organization_id))
  with check (public.is_org_manager(organization_id));

create policy "settings_delete_management" on public.workspace_settings
  for delete using (public.is_org_manager(organization_id));
