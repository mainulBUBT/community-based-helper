-- পণ্য লুকানো: পুরনো মডেল মুছে না ফেলে সাইট থেকে সরানো যায়, অ্যাডমিন তবু দেখে
alter table products add column active boolean not null default true;
drop policy "public read" on products;
create policy "public read" on products for select using (active or is_admin());

-- ভিজিটের দেশ (Cloudflare এর cf-ipcountry) আর ডিভাইস (user-agent থেকে); IP বা পুরো user-agent রাখা হয় না
alter table page_views add column country text, add column device text;
alter table page_views add constraint page_views_country_code check (country is null or country ~ '^[A-Z]{2}$') not valid;
alter table page_views add constraint page_views_device_kind check (device is null or device in ('mobile', 'tablet', 'desktop')) not valid;

create function request_header(header text) returns text
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.headers', true), '')::json ->> header;
$$;

revoke execute on function request_header(text) from public, anon, authenticated;

create or replace function guard_page_view() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ip text := public.client_ip();
  agent text := coalesce(public.request_header('user-agent'), '');
  today int;
begin
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

-- অ্যাডমিনের ভিজিটর পেজ: শুধু পেজ খুললে হিসাব হয়, সর্বোচ্চ ৯০ দিনের (তার আগের সারি এমনিতেই মুছে যায়)
create function visitor_insights(days int default 30) returns jsonb
language sql stable security definer set search_path = '' as $$
  with shown as (
    select visitor, country, device, referrer, created_at,
      substring(path from '^(?:/en)?/product/([^/?]+)/') as slug,
      substring(path from '^(?:/en)?/(?:search|category/[^/]+)/\?(?:.*&)?q=([^&]+)') as query
    from public.page_views
    where public.is_admin() and created_at > now() - make_interval(days => least(greatest(days, 1), 90))
  )
  select jsonb_build_object(
    'visitors', (select count(distinct visitor) from shown),
    'returning', (select count(*) from (select visitor from shown group by visitor having count(distinct created_at::date) > 1) r),
    'countries', coalesce((select jsonb_agg(x) from (
      select country, count(*) as views, count(distinct visitor) as visitors from shown group by country order by visitors desc limit 15) x), '[]'),
    'devices', coalesce((select jsonb_agg(x) from (
      select device, count(*) as views, count(distinct visitor) as visitors from shown group by device order by visitors desc) x), '[]'),
    'referrers', coalesce((select jsonb_agg(x) from (
      select referrer, count(*) as views, count(distinct visitor) as visitors from shown
      where referrer is not null and referrer !~* 'dordam' group by referrer order by visitors desc limit 10) x), '[]'),
    'products', coalesce((select jsonb_agg(x) from (
      select s.slug, p.brand || ' ' || p.name as name, count(*) as views, count(distinct s.visitor) as visitors
      from shown s join public.products p on p.slug = s.slug
      group by s.slug, p.brand, p.name order by views desc limit 15) x), '[]'),
    'searches', coalesce((select jsonb_agg(x) from (
      select query, count(*) as times, count(distinct visitor) as visitors from shown
      where query is not null group by query order by times desc limit 20) x), '[]')
  );
$$;

revoke execute on function visitor_insights(int) from public, anon;
grant execute on function visitor_insights(int) to authenticated;
