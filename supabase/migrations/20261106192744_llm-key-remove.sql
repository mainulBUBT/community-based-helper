-- প্রোভাইডার মুছলে তার key-ও মোছা যাক: patch এ removeLlmKey (Base URL) দিলে llmKeys থেকে ওই ঘরটা বাদ

create or replace function save_private_settings(patch jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  saved jsonb := coalesce((select value from public.private_settings), '{}');
  next jsonb := patch - 'github' - 'llmKeys' - 'removeLlmKey';
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
  if coalesce(patch ->> 'removeLlmKey', '') <> '' then
    keys := keys - rtrim(trim(patch ->> 'removeLlmKey'), '/');
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
