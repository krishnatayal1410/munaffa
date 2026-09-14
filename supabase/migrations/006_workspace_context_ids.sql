-- Expose stable workspace identifiers to authenticated clients so production
-- modules can query tenant-scoped records through RLS without resolving names.

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
    order by p1.created_at asc
    limit 1
  ) p on true
  left join public.workspace_settings s on s.organization_id = o.id
  where m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_workspace_context() from public;
grant execute on function public.get_workspace_context() to authenticated;
