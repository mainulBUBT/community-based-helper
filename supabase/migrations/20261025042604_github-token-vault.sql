-- GitHub token lives in Supabase Vault (name: github_token); the old private_settings value still works until it is moved
create or replace function dispatch_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  github jsonb := (select value -> 'github' from private_settings);
  token text;
begin
  begin
    token := (select decrypted_secret from vault.decrypted_secrets where name = 'github_token' limit 1);
  exception when undefined_table or invalid_schema_name then
    token := null;
  end;
  token := coalesce(token, github ->> 'token');
  if new.run_requested_at is null or github ->> 'repo' is null or token is null then
    return new;
  end if;
  perform net.http_post(
    url := format('https://api.github.com/repos/%s/actions/workflows/%s.yml/dispatches', github ->> 'repo', new.id),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token,
      'Accept', 'application/vnd.github+json',
      'User-Agent', 'DordamBot'
    ),
    body := jsonb_build_object('ref', coalesce(github ->> 'ref', 'main'))
  );
  return new;
end;
$$;
