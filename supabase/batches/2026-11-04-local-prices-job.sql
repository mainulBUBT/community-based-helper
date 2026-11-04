-- ২০২৬-১১-০৪: `local_prices` জব — GitHub যেসব দোকানে 403 পায়, সেগুলোর দাম আপডেট এই মেশিনের (ম্যাক/PC/Termux) রানার থেকে।
-- অ্যাডমিনে "এখনই চালান" দিলে jobs.run_requested_at বসে; রানার (scripts/local-runner.sh) সেটা দেখে চালায়। GitHub ডাকা হয় না।
-- এখনও লাইভে চালানো হয়নি; একবার চালাতে হবে:
--   npx supabase db query --linked -f supabase/batches/2026-11-04-local-prices-job.sql
begin;

insert into jobs (id, name, runner, schedule, enabled)
values ('local_prices', 'আটকানো দোকানের দাম (লোকাল)', 'Local Runner (ম্যাক / PC / ফোন)', 'অ্যাডমিনের অনুরোধে, আর রানার চালু থাকলে প্রতি ৪ ঘণ্টায়', true)
on conflict (id) do nothing;

-- লোকাল রানারের জব GitHub workflow এ ডাকা যায় না (local_prices.yml নেই); বাকি জবে আচরণ একই
create or replace function public.dispatch_job()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  github jsonb := (select value -> 'github' from private_settings);
  token text;
begin
  if new.runner ilike 'local%' then
    return new;
  end if;
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
$function$;

commit;
