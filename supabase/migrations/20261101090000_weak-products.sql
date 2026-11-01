-- AI ম্যানেজারের জন্য: যে পণ্য রাখার মানে কম (স্টকসহ ২টার কম দোকান, দাম অনেকদিন যাচাই হয়নি, ৩০ দিনে কেউ খোলেনি)।
-- শুধু service key (ম্যানেজার) ডাকতে পারে; কিছু বদলায় না
create or replace function weak_products()
returns table (slug text, name text, category text, release_year int, in_stock int, sellers int, last_checked timestamptz, views bigint)
language sql stable security definer set search_path = public as $$
  with o as (
    select v.product_id,
      count(distinct f.seller_id) filter (where f.published and f.price > 0 and f.in_stock is not false) as in_stock,
      count(distinct f.seller_id) filter (where f.published and f.price > 0) as sellers,
      max(f.checked_at) as last_checked
    from variants v left join offers f on f.variant_id = v.id
    group by v.product_id
  ), pv as (
    select substring(path from '^(?:/en)?/product/([^/?]+)') as slug, count(*) as views
    from page_views where created_at > now() - interval '30 days' and path ~ '^(/en)?/product/'
    group by 1
  )
  select p.slug, p.brand || ' ' || p.name, p.category, p.release_year,
    coalesce(o.in_stock, 0)::int, coalesce(o.sellers, 0)::int, o.last_checked, coalesce(pv.views, 0)
  from products p left join o on o.product_id = p.id left join pv on pv.slug = p.slug
  where p.active and (coalesce(o.in_stock, 0) < 2 or o.last_checked < now() - interval '7 days' or coalesce(pv.views, 0) = 0)
  order by coalesce(o.in_stock, 0), coalesce(pv.views, 0), p.release_year nulls first
  limit 150;
$$;

revoke execute on function weak_products() from public, anon, authenticated;
grant execute on function weak_products() to service_role;
