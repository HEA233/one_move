create or replace function public.om_final(
  p_session_id uuid,
  p_round_id uuid,
  p_command_id uuid,
  p_expected_revision integer,
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
  final_brand_value text;
  switched_value boolean;
  story_delta_value integer;
begin
  select * into prior from public.om_commands where session_id = p_session_id and command_id = p_command_id;
  if found then
    if prior.action <> 'final' or prior.request_hash <> p_request_hash or prior.round_id <> p_round_id then raise exception 'command_conflict' using errcode = 'P0001'; end if;
    select * into round_row from public.om_rounds where id = prior.round_id;
    return jsonb_build_object('round', to_jsonb(round_row), 'replayed', true, 'command_id', p_command_id);
  end if;

  select * into round_row from public.om_rounds where id = p_round_id and session_id = p_session_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if round_row.revision <> p_expected_revision then raise exception 'stale_revision' using errcode = 'P0001'; end if;
  if round_row.phase <> 'awaiting_rechoice' or round_row.initial_brand is null or round_row.target_brand is null or round_row.selected_note is null then raise exception 'conflict' using errcode = 'P0001'; end if;
  if round_row.selected_note->>'noteHash' <> p_plan->>'noteHash' then raise exception 'conflict' using errcode = 'P0001'; end if;

  final_brand_value := p_plan->>'finalBrand';
  if final_brand_value not in ('charitea_mate_can', 'oom_balance') then raise exception 'conflict' using errcode = 'P0001'; end if;
  switched_value := final_brand_value <> round_row.initial_brand;
  story_delta_value := case when switched_value then 10 else -10 end;

  if p_plan->'exposureAcknowledgement' is not null and jsonb_typeof(p_plan->'exposureAcknowledgement') <> 'null' then
    if p_plan->'exposureAcknowledgement'->>'noteHash' <> round_row.selected_note->>'noteHash' then raise exception 'conflict' using errcode = 'P0001'; end if;
    insert into public.om_exposures(round_id, note_snapshot_hash, event_type, client_reported_at, acknowledgement_source)
      values (p_round_id, round_row.selected_note->>'noteHash', 'note_rendered', (p_plan->'exposureAcknowledgement'->>'clientReportedDisplayedAt')::timestamptz, 'final_payload')
      on conflict (round_id, event_type, note_snapshot_hash) do nothing;
  end if;

  update public.om_rounds set
    exposure_note_hash = case when exposure_note_hash is null and jsonb_typeof(p_plan->'exposureAcknowledgement') = 'object' then round_row.selected_note->>'noteHash' else exposure_note_hash end,
    exposure_client_reported_at = case when exposure_client_reported_at is null and jsonb_typeof(p_plan->'exposureAcknowledgement') = 'object' then (p_plan->'exposureAcknowledgement'->>'clientReportedDisplayedAt')::timestamptz else exposure_client_reported_at end,
    exposure_acknowledged_at = case when exposure_acknowledged_at is null and jsonb_typeof(p_plan->'exposureAcknowledgement') = 'object' then now() else exposure_acknowledged_at end,
    exposure_acknowledgement_source = case when exposure_acknowledgement_source is null and jsonb_typeof(p_plan->'exposureAcknowledgement') = 'object' then 'final_payload' else exposure_acknowledgement_source end,
    final_brand = final_brand_value,
    switched = switched_value,
    story_delta = story_delta_value,
    phase = 'finished',
    ended_at = now(),
    revision = revision + 1,
    updated_at = now()
  where id = p_round_id;

  insert into public.om_round_outcomes(round_id, target_brand, initial_brand, final_brand, switched, story_delta)
    values (p_round_id, round_row.target_brand, round_row.initial_brand, final_brand_value, switched_value, story_delta_value);
  insert into public.om_commands(session_id, round_id, command_id, action, request_hash) values (p_session_id, p_round_id, p_command_id, 'final', p_request_hash);
  select * into round_row from public.om_rounds where id = p_round_id;
  return jsonb_build_object('round', to_jsonb(round_row), 'replayed', false, 'command_id', p_command_id);
end;
$$;
