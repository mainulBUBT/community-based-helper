-- secrets are write-only from the browser: admins see a masked hint, workers (service role) read the real value
drop policy "admin all" on private_settings;

create function mask_secret(secret text) returns text
language sql immutable set search_path = '' as $$
  select case when coalesce(secret, '') = '' then null else '••••' || right(secret, 4) end;
$$;

create function private_settings_masked() returns jsonb
language sql stable security definer set search_path = '' as $$
  select (v - 'github')
    || jsonb_build_object('telegramBotToken', public.mask_secret(v ->> 'telegramBotToken'))
    || jsonb_build_object('llm', coalesce(v -> 'llm', '{}') || jsonb_build_object('apiKey', public.mask_secret(v -> 'llm' ->> 'apiKey')))
  from (select coalesce((select value from public.private_settings), '{}') as v) s
  where public.is_admin();
$$;

-- a blank secret keeps the saved one; github settings are never touched from the browser
create function save_private_settings(patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  saved jsonb := coalesce((select value from public.private_settings), '{}');
  next jsonb := patch - 'github';
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if coalesce(next -> 'llm' ->> 'apiKey', '') = '' then
    next := jsonb_set(next, '{llm}', coalesce(next -> 'llm', '{}') || jsonb_build_object('apiKey', saved -> 'llm' -> 'apiKey'));
  end if;
  if coalesce(next ->> 'telegramBotToken', '') = '' then
    next := next || jsonb_build_object('telegramBotToken', saved -> 'telegramBotToken');
  end if;
  insert into public.private_settings (id, value) values (true, saved || next)
  on conflict (id) do update set value = excluded.value;
end;
$$;

revoke execute on function private_settings_masked() from public, anon;
revoke execute on function save_private_settings(jsonb) from public, anon;
grant execute on function private_settings_masked() to authenticated;
grant execute on function save_private_settings(jsonb) to authenticated;

-- audit log: admins add their own entries and read them, nobody edits or deletes from the browser
drop policy "admin all" on audit_log;
create policy "admin read" on audit_log for select using (is_admin());
create policy "admin add own" on audit_log for insert with check (is_admin() and actor = auth.uid());

alter function record_price() set search_path = public;
alter function categories_slug_immutable() set search_path = public;

revoke truncate on all tables in schema public from anon, authenticated;

-- older rows are checked too; a bad old row only leaves that one check unvalidated
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('offers', 'offers_url_http'),
      ('sellers', 'sellers_website_http'),
      ('sellers', 'sellers_facebook_http'),
      ('products', 'products_specs_source_http'),
      ('review_queue', 'review_payload_small'),
      ('page_views', 'page_views_referrer_len')
    ) as c(tbl, name)
  loop
    begin
      execute format('alter table %I validate constraint %I', item.tbl, item.name);
    exception when check_violation then
      raise notice 'kept % on % unvalidated: old rows break it', item.name, item.tbl;
    end;
  end loop;
end;
$$;
