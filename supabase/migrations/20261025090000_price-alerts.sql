-- দাম কমলে web push: লগইন নেই, তাই ব্রাউজারের push ঠিকানাই পরিচয়; সরাসরি পড়া-লেখা বন্ধ, শুধু নিচের function দিয়ে
create table price_alerts (
  endpoint text not null check (length(endpoint) <= 1000),
  p256dh text not null check (length(p256dh) between 60 and 120),
  auth text not null check (length(auth) between 16 and 40),
  product_id uuid not null references products on delete cascade,
  lang text not null default 'bn' check (lang in ('bn', 'en')),
  price int,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (endpoint, product_id)
);
alter table price_alerts enable row level security;
revoke all on price_alerts from anon, authenticated;

-- কার্ডে যে দাম দেখায়, শুধু স্টকে থাকা দোকান থেকে: ওয়ারেন্টি আছে এমন ক্যাটাগরিতে অফিসিয়াল আগে
create function alert_price(p_product uuid) returns int
language sql stable set search_path = '' as $$
  with live as (
    select o.price, o.condition = 'official' or c.warranty is false as preferred
    from public.offers o
    join public.variants v on v.id = o.variant_id
    join public.products p on p.id = v.product_id
    left join public.categories c on c.slug = p.category
    where v.product_id = p_product and o.published and o.in_stock is not false
      and (o.expires_at is null or o.expires_at > now())
  )
  select coalesce((select min(price) from live where preferred), (select min(price) from live));
$$;

-- push ঠিকানা শুধু পরিচিত push সার্ভিসের হতে পারে, যাতে worker কে দিয়ে অন্য কোথাও অনুরোধ পাঠানো না যায়
create function push_endpoint_ok(p_endpoint text) returns boolean
language sql immutable set search_path = '' as $$
  select p_endpoint ~ '^https://(fcm\.googleapis\.com|[a-z0-9-]+\.google\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[A-Za-z0-9_:/.=+%-]+$';
$$;

create function watch_prices(p_endpoint text, p_p256dh text, p_auth text, p_slugs text[], p_lang text default 'bn') returns int
language plpgsql security definer set search_path = '' as $$
declare
  ip text := public.client_ip();
  added int;
begin
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

-- p_slugs না দিলে ওই ব্রাউজারের সব বন্ধ
create function unwatch_prices(p_endpoint text, p_slugs text[] default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ip text := public.client_ip();
begin
  if ip is not null and public.take_hit('alerts:ip', ip, interval '1 hour') > 60 then
    raise exception 'too many requests, try again later';
  end if;
  delete from public.price_alerts a
  using public.products p
  where a.endpoint = p_endpoint and p.id = a.product_id and (p_slugs is null or p.slug = any (p_slugs));
end;
$$;

-- worker এর জন্য: নতুন সারির শুরুর দাম বসায়, তারপর যেগুলোর দাম কমেছে আর গত ২৪ ঘণ্টায় জানানো হয়নি
create function due_price_alerts() returns table (endpoint text, p256dh text, auth text, lang text, product_id uuid, slug text, name text, old_price int, new_price int)
language plpgsql security definer set search_path = '' as $$
begin
  update public.price_alerts a set price = public.alert_price(a.product_id) where a.price is null;
  return query
    select a.endpoint, a.p256dh, a.auth, a.lang, p.id, p.slug, p.brand || ' ' || p.name, a.price, n.price
    from public.price_alerts a
    join public.products p on p.id = a.product_id and p.active
    cross join lateral (select public.alert_price(p.id) as price) n
    where n.price is not null and a.price is not null
      and n.price < a.price
      and (a.notified_at is null or a.notified_at < now() - interval '1 day')
    order by a.endpoint, a.price - n.price desc;
end;
$$;

revoke execute on function alert_price(uuid) from public, anon, authenticated;
revoke execute on function push_endpoint_ok(text) from public, anon, authenticated;
revoke execute on function due_price_alerts() from public, anon, authenticated;
revoke execute on function watch_prices(text, text, text, text[], text) from public;
revoke execute on function unwatch_prices(text, text[]) from public;
grant execute on function watch_prices(text, text, text, text[], text) to anon, authenticated;
grant execute on function unwatch_prices(text, text[]) to anon, authenticated;
