-- পপআপ ব্যানার আর মৌসুমি টাইলের দেখা-ক্লিকও page_views এ যায়, source ঘরে চিহ্ন দিয়ে আলাদা।
-- সাধারণ পেজ ভিউ 'page'; বাকিগুলো অ্যাডমিন → ভিজিটরের ব্যানার প্যানেলে দেখা যায়, পেজের হিসাবে মেশে না।

alter table page_views add column source text not null default 'page';
alter table page_views add constraint page_views_source_safe
  check (source ~ '^[a-z][a-z0-9-]{0,29}$');

create index page_views_event_idx on page_views (created_at desc) where source <> 'page';

create or replace function visitor_stats(days int default 30)
returns table (day date, views bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select date_trunc('day', created_at)::date, count(*), count(distinct visitor)
  from page_views
  where is_admin() and source = 'page' and created_at > now() - make_interval(days => days)
  group by 1 order by 1;
$$;

create or replace function top_pages(days int default 30, max_rows int default 20)
returns table (path text, views bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select path, count(*), count(distinct visitor)
  from page_views
  where is_admin() and source = 'page' and created_at > now() - make_interval(days => least(days, 365))
  group by 1 order by 2 desc limit least(max_rows, 100);
$$;

create or replace function visitors_online() returns table (path text, product text, country text, device text, seen_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select path, product, country, device, created_at from (
    select distinct on (v.visitor) v.path, p.brand || ' ' || p.name as product, v.country, v.device, v.created_at
    from public.page_views v
    left join public.products p on p.slug = substring(v.path from '^(?:/en)?/product/([^/?]+)/')
    where public.is_admin() and v.source = 'page' and v.created_at > now() - interval '5 minutes'
    order by v.visitor, v.created_at desc
  ) latest
  order by created_at desc
  limit 200;
$$;

create or replace function visitor_insights(days int default 30) returns jsonb
language sql stable security definer set search_path = '' as $$
  with shown as (
    select visitor, country, device, referrer, created_at,
      substring(path from '^(?:/en)?/product/([^/?]+)/') as slug,
      substring(path from '^(?:/en)?/(?:search|category/[^/]+)/\?(?:.*&)?q=([^&]+)') as query
    from public.page_views
    where public.is_admin() and source = 'page' and created_at > now() - make_interval(days => least(greatest(days, 1), 90))
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
      where query is not null group by query order by times desc limit 20) x), '[]'),
    'events', coalesce((select jsonb_agg(x) from (
      select source, count(*) as times, count(distinct visitor) as visitors from public.page_views
      where public.is_admin() and source <> 'page' and created_at > now() - make_interval(days => least(greatest(days, 1), 90))
      group by source order by times desc) x), '[]')
  );
$$;
