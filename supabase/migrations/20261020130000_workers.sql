create extension if not exists pg_net with schema extensions;

alter table review_queue add column applied_at timestamptz;

insert into sellers (name, kind, website, verified)
select v.name, 'website', v.website, true
from (values
  ('Star Tech', 'https://www.startech.com.bd/'),
  ('Pickaboo', 'https://www.pickaboo.com/'),
  ('Apple Gadgets', 'https://www.applegadgetsbd.com/'),
  ('Gadget & Gear', 'https://gadgetandgear.com/')
) as v (name, website)
where not exists (
  select 1 from sellers s
  where regexp_replace(s.website, '^https?://(www\.)?|/.*$', '', 'g') = regexp_replace(v.website, '^https?://(www\.)?|/.*$', '', 'g')
);

update jobs set runner = 'GitHub Actions', schedule = case id
  when 'prices' then 'প্রতি ৩ ঘণ্টায়'
  when 'js-stores' then 'দিনে দুবার'
  when 'discover' then 'প্রতি রাতে'
  when 'promos' then 'দিনে একবার'
  when 'rebuild' then 'প্রতি রাতে'
end;

create function dispatch_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  github jsonb := (select value -> 'github' from private_settings);
begin
  if new.run_requested_at is null or github ->> 'repo' is null or github ->> 'token' is null then
    return new;
  end if;
  perform net.http_post(
    url := format('https://api.github.com/repos/%s/actions/workflows/%s.yml/dispatches', github ->> 'repo', new.id),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (github ->> 'token'),
      'Accept', 'application/vnd.github+json',
      'User-Agent', 'DordamBot'
    ),
    body := jsonb_build_object('ref', coalesce(github ->> 'ref', 'main'))
  );
  return new;
end;
$$;

create trigger jobs_dispatch after update of run_requested_at on jobs
  for each row when (new.run_requested_at is distinct from old.run_requested_at)
  execute function dispatch_job();
