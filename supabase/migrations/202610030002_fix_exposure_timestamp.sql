create or replace function public.om_exposure(
  p_session_id uuid,
  p_round_id uuid,
  p_command_id uuid,
  p_request_hash text,
  p_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  prior public.om_commands%rowtype;
  round_row public.om_rounds%rowtype;
begin
  select * into prior from public.om_commands where session_id = p_session_id and command_id = p_command_id;
  if found then
    if prior.action <> 'exposure' or prior.request_hash <> p_request_hash or prior.round_id <> p_round_id then raise exception 'command_conflict' using errcode = 'P0001'; end if;
    select * into round_row from public.om_rounds where id = prior.round_id;
    return jsonb_build_object('round', to_jsonb(round_row), 'replayed', true, 'command_id', p_command_id);
  end if;

  select * into round_row from public.om_rounds where id = p_round_id and session_id = p_session_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if round_row.selected_note is null or round_row.selected_note->>'noteHash' <> p_plan->>'noteHash' then raise exception 'conflict' using errcode = 'P0001'; end if;
  if round_row.phase not in ('awaiting_rechoice', 'finished') then raise exception 'conflict' using errcode = 'P0001'; end if;

  insert into public.om_exposures(round_id, note_snapshot_hash, event_type, client_reported_at, acknowledgement_source)
    values (p_round_id, p_plan->>'noteHash', 'note_rendered', (p_plan->>'clientReportedDisplayedAt')::timestamptz, p_plan->>'acknowledgementSource')
    on conflict (round_id, event_type, note_snapshot_hash) do nothing;
  update public.om_rounds set
    exposure_note_hash = coalesce(exposure_note_hash, p_plan->>'noteHash'),
    exposure_client_reported_at = coalesce(exposure_client_reported_at, (p_plan->>'clientReportedDisplayedAt')::timestamptz),
    exposure_acknowledged_at = coalesce(exposure_acknowledged_at, now()),
    exposure_acknowledgement_source = coalesce(exposure_acknowledgement_source, p_plan->>'acknowledgementSource'),
    updated_at = now()
  where id = p_round_id;
  insert into public.om_commands(session_id, round_id, command_id, action, request_hash) values (p_session_id, p_round_id, p_command_id, 'exposure', p_request_hash);
  select * into round_row from public.om_rounds where id = p_round_id;
  return jsonb_build_object('round', to_jsonb(round_row), 'replayed', false, 'command_id', p_command_id);
end;
$$;
