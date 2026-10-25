-- anonymous inserts: server-set time, per-IP and daily caps, old rows pruned

create table rate_limits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (bucket, key, window_start)
);
alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

-- Cloudflare sets cf-connecting-ip itself, so the client cannot fake it
create function client_ip() returns text
language sql stable set search_path = '' as $$
  select nullif(split_part(trim(coalesce(
    headers ->> 'cf-connecting-ip',
    headers ->> 'x-real-ip',
    headers ->> 'x-forwarded-for',
    ''
  )), ',', 1), '')
  from (select nullif(current_setting('request.headers', true), '')::json as headers) h;
$$;

-- counts one hit in the current window and returns the total so far; the IP is stored only as a hash
create function take_hit(p_bucket text, p_key text, p_window interval) returns int
language plpgsql security definer set search_path = '' as $$
declare
  used int;
begin
  insert into public.rate_limits as r (bucket, key, window_start)
  values (p_bucket, md5(p_key), date_bin(p_window, now(), timestamptz '2000-01-01'))
  on conflict (bucket, key, window_start) do update set hits = r.hits + 1
  returning hits into used;
  return used;
end;
$$;

revoke execute on function client_ip() from public, anon, authenticated;
revoke execute on function take_hit(text, text, interval) from public, anon, authenticated;

update review_queue set created_at = now() where created_at > now();
update page_views set created_at = now() where created_at > now();

create or replace function limit_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ip text := public.client_ip();
begin
  new.created_at := now();
  if ip is not null and public.take_hit('submit:ip', ip, interval '10 minutes') > 5 then
    raise exception 'too many submissions, try again later';
  end if;
  if (select count(*) from public.review_queue where kind = 'submission' and created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'too many submissions, try again later';
  end if;
  return new;
end;
$$;

-- over the limit the row is skipped quietly; the first view of each day prunes old data
create function guard_page_view() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ip text := public.client_ip();
  today int;
begin
  new.created_at := now();
  if ip is not null and public.take_hit('views:ip', ip, interval '1 hour') > 300 then
    return null;
  end if;
  today := public.take_hit('views:day', 'all', interval '1 day');
  if today = 1 then
    delete from public.page_views where created_at < now() - interval '90 days';
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
  if today > 10000 then
    return null;
  end if;
  return new;
end;
$$;

create trigger page_views_guard before insert on page_views
  for each row execute function guard_page_view();

alter table page_views add constraint page_views_path_safe
  check (path ~ '^/' and path !~ '^//' and path !~ '[\\[:space:][:cntrl:]]') not valid;
alter table page_views add constraint page_views_visitor_safe
  check (visitor ~ '^[A-Za-z0-9-]{1,64}$') not valid;
alter table page_views add constraint page_views_referrer_host
  check (referrer is null or referrer ~ '^[A-Za-z0-9.-]{1,255}$') not valid;
