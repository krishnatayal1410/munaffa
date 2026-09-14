-- Safe rotation for ordering-point secrets and scoped guest status lookup.

create or replace function public.rotate_ordering_point_token(p_ordering_point_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_point public.ordering_points%rowtype;
  v_role text;
  v_token text;
  v_hash text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_point from public.ordering_points where id = p_ordering_point_id for update;
  if v_point.id is null then raise exception 'Ordering point not found'; end if;

  select role into v_role from public.organization_members
  where organization_id = v_point.organization_id and user_id = v_user_id;
  if v_role not in ('owner','manager') then raise exception 'Only owners or managers can rotate ordering links'; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  update public.ordering_points
  set token_hash = v_hash, active = true, updated_at = now()
  where id = v_point.id;

  return jsonb_build_object(
    'id', v_point.id,
    'token', v_token,
    'label', v_point.label,
    'service_type', v_point.service_type,
    'max_open_orders', v_point.max_open_orders
  );
end;
$$;

create or replace function public.get_guest_order_status(p_token text, p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_hash text;
  v_point_id uuid;
  v_order public.orders%rowtype;
begin
  if p_token is null or char_length(trim(p_token)) < 32 then raise exception 'Invalid ordering link'; end if;
  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select id into v_point_id from public.ordering_points where token_hash = v_hash;
  if v_point_id is null then raise exception 'Ordering link is invalid'; end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and ordering_point_id = v_point_id
    and created_via = 'guest_qr';
  if v_order.id is null then raise exception 'Order was not created from this ordering point'; end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'currency', v_order.currency,
    'created_at', v_order.created_at,
    'completed_at', v_order.completed_at
  );
end;
$$;

revoke all on function public.rotate_ordering_point_token(uuid) from public;
revoke all on function public.get_guest_order_status(text,uuid) from public;
grant execute on function public.rotate_ordering_point_token(uuid) to authenticated;
grant execute on function public.get_guest_order_status(text,uuid) to anon, authenticated;
