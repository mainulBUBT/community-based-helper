-- বেনামি লেখা (ভিজিট, দাম-কমার alert) শুধু সাইটের নিজের Pages Function (functions/api/*) দিয়ে আসে।
-- Vault এ proxy_key রাখলে সেই header (x-proxy-key) ছাড়া কিছুই DB তে কাজ করে না: সরাসরি Supabase এ flood করলে
-- প্রতিটা request একটা তুলনাতেই শেষ, trigger এর লেখা বা rate_limits এর সারি হয় না। key না থাকলে আগের মতো সরাসরি চলে।

create function proxy_key() returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  key text;
begin
  begin
    select decrypted_secret into key from vault.decrypted_secrets where name = 'proxy_key' limit 1;
  exception when undefined_table or invalid_schema_name or insufficient_privilege then
    key := null;
  end;
  return nullif(key, '');
end;
$$;

create function proxy_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.proxy_key() = public.request_header('x-proxy-key'), public.proxy_key() is null);
$$;

revoke execute on function proxy_key() from public, anon, authenticated;
revoke execute on function proxy_ok() from public, anon, authenticated;

-- Function দিয়ে এলে আসল ভিজিটরের IP x-client-ip তে থাকে (cf-connecting-ip তখন Cloudflare এর নিজের ঠিকানা)
create or replace function client_ip() returns text
language sql stable set search_path = '' as $$
  select nullif(split_part(trim(coalesce(
    case when public.proxy_key() is not null and public.proxy_ok() then headers ->> 'x-client-ip' end,
    headers ->> 'cf-connecting-ip',
    headers ->> 'x-real-ip',
    headers ->> 'x-forwarded-for',
    ''
  )), ',', 1), '')
  from (select nullif(current_setting('request.headers', true), '')::json as headers) h;
$$;

create or replace function guard_page_view() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ip text;
  agent text;
  today int;
begin
  if not public.proxy_ok() then
    return null;
  end if;
  ip := public.client_ip();
  agent := coalesce(public.request_header('user-agent'), '');
  new.created_at := now();
  new.country := upper(coalesce(public.request_header('cf-ipcountry'), ''));
  if new.country !~ '^[A-Z]{2}$' or new.country in ('XX', 'T1') then
    new.country := null;
  end if;
  new.device := case
    when agent = '' then null
    when agent ~* 'ipad|tablet' then 'tablet'
    when agent ~* 'mobi|android|iphone' then 'mobile'
    else 'desktop'
  end;
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

create or replace function watch_prices(p_endpoint text, p_p256dh text, p_auth text, p_slugs text[], p_lang text default 'bn') returns int
language plpgsql security definer set search_path = '' as $$
declare
  ip text;
  added int;
begin
  if not public.proxy_ok() then
    raise exception 'use the site';
  end if;
  ip := public.client_ip();
  if not public.push_endpoint_ok(p_endpoint) or coalesce(cardinality(p_slugs), 0) not between 1 and 100 then
    raise exception 'invalid alert';
  end if;
  if ip is not null and public.take_hit('alerts:ip', ip, interval '1 hour') > 60 then
    raise exception 'too many requests, try again later';
  end if;
  if (select count(*) from public.price_alerts) >= 50000 then
    raise exception 'too many alerts';
  end if;

  update public.price_alerts set p256dh = p_p256dh, auth = p_auth, lang = coalesce(nullif(p_lang, ''), 'bn')
  where endpoint = p_endpoint;

  insert into public.price_alerts (endpoint, p256dh, auth, product_id, lang, price)
  select p_endpoint, p_p256dh, p_auth, p.id, coalesce(nullif(p_lang, ''), 'bn'), public.alert_price(p.id)
  from public.products p
  where p.slug = any (p_slugs) and p.active
  on conflict (endpoint, product_id) do nothing;
  get diagnostics added = row_count;

  if (select count(*) from public.price_alerts where endpoint = p_endpoint) > 100 then
    raise exception 'too many alerts';
  end if;
  return added;
end;
$$;

create or replace function unwatch_prices(p_endpoint text, p_slugs text[] default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ip text;
begin
  if not public.proxy_ok() then
    raise exception 'use the site';
  end if;
  ip := public.client_ip();
  if ip is not null and public.take_hit('alerts:ip', ip, interval '1 hour') > 60 then
    raise exception 'too many requests, try again later';
  end if;
  delete from public.price_alerts a
  using public.products p
  where a.endpoint = p_endpoint and p.id = a.product_id and (p_slugs is null or p.slug = any (p_slugs));
end;
$$;
