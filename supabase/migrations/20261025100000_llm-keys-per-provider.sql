-- প্রতিটা AI প্রোভাইডারের key আলাদা থাকে (Base URL ধরে); worker যেটা ব্যবহার করে সেই llm.apiKey সবসময় বাছাই করা প্রোভাইডারের key

update private_settings
set value = value || jsonb_build_object('llmKeys', jsonb_build_object(rtrim(value -> 'llm' ->> 'baseUrl', '/'), value -> 'llm' ->> 'apiKey'))
where value -> 'llmKeys' is null and coalesce(value -> 'llm' ->> 'apiKey', '') <> '' and coalesce(value -> 'llm' ->> 'baseUrl', '') <> '';

create or replace function private_settings_masked() returns jsonb
language sql stable security definer set search_path = '' as $$
  select (v - 'github' - 'llmKeys')
    || jsonb_build_object('telegramBotToken', public.mask_secret(v ->> 'telegramBotToken'))
    || jsonb_build_object('llm', coalesce(v -> 'llm', '{}') || jsonb_build_object('apiKey', public.mask_secret(v -> 'llm' ->> 'apiKey')))
    || jsonb_build_object('llmKeys', coalesce((select jsonb_object_agg(k, public.mask_secret(secret)) from jsonb_each_text(coalesce(v -> 'llmKeys', '{}')) as e(k, secret)), '{}'))
  from (select coalesce((select value from public.private_settings), '{}') as v) s
  where public.is_admin();
$$;

-- key লিখলে শুধু সেই প্রোভাইডারের key বদলায়; খালি রাখলে ওই প্রোভাইডারের আগের key (না থাকলে কোনো key নেই)
create or replace function save_private_settings(patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  saved jsonb := coalesce((select value from public.private_settings), '{}');
  next jsonb := patch - 'github' - 'llmKeys';
  base text := rtrim(trim(coalesce(patch -> 'llm' ->> 'baseUrl', '')), '/');
  typed text := nullif(trim(coalesce(patch -> 'llm' ->> 'apiKey', '')), '');
  keys jsonb := coalesce(saved -> 'llmKeys', '{}');
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if keys = '{}' and coalesce(saved -> 'llm' ->> 'apiKey', '') <> '' then
    keys := jsonb_build_object(rtrim(coalesce(saved -> 'llm' ->> 'baseUrl', ''), '/'), saved -> 'llm' ->> 'apiKey');
  end if;
  if typed is not null and base <> '' then
    keys := keys || jsonb_build_object(base, typed);
  end if;
  next := jsonb_set(next, '{llm}', coalesce(next -> 'llm', '{}') || jsonb_build_object('apiKey', keys -> base));
  if coalesce(next ->> 'telegramBotToken', '') = '' then
    next := next || jsonb_build_object('telegramBotToken', saved -> 'telegramBotToken');
  end if;
  insert into public.private_settings (id, value) values (true, saved || next || jsonb_build_object('llmKeys', keys))
  on conflict (id) do update set value = excluded.value;
end;
$$;
