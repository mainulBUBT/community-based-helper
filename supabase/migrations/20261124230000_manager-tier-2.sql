create table public.agent_product_candidates (
  product_id uuid primary key references public.products (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ((status = 'pending' and resolved_at is null) or (status <> 'pending' and resolved_at is not null))
);

alter table public.agent_product_candidates enable row level security;
revoke all on public.agent_product_candidates from public, anon, authenticated, service_role;

create function public.agent_cancel_candidate_on_admin_change()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.agent_product_candidates
  set status = case when new.active then 'published' else 'cancelled' end,
      resolved_at = pg_catalog.now()
  where product_id = new.id and status = 'pending';
  return new;
end;
$$;
revoke all on function public.agent_cancel_candidate_on_admin_change() from public, anon, authenticated, service_role;

create trigger agent_candidate_admin_change
after update of active on public.products
for each row execute function public.agent_cancel_candidate_on_admin_change();

create function public.agent_same_product(p_a_brand text, p_a_name text, p_b_brand text, p_b_name text)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  a text := lower(pg_catalog.regexp_replace(coalesce(p_a_brand, '') || coalesce(p_a_name, ''), '[^[:alnum:]]', '', 'g'));
  b text := lower(pg_catalog.regexp_replace(coalesce(p_b_brand, '') || coalesce(p_b_name, ''), '[^[:alnum:]]', '', 'g'));
  shorter text;
  longer text;
  suffix text;
begin
  if a = '' or b = '' then return false; end if;
  if a = b then return true; end if;

  if pg_catalog.char_length(a) < pg_catalog.char_length(b) then
    shorter := a;
    longer := b;
  else
    shorter := b;
    longer := a;
  end if;

  if pg_catalog.left(longer, pg_catalog.char_length(shorter)) <> shorter then return false; end if;
  suffix := pg_catalog.substr(longer, pg_catalog.char_length(shorter) + 1);
  return suffix !~ '^[2-5]g$' and suffix ~ '^[0-9]+(mm|gb|tb|ml|g|mah|inch|in)$';
end;
$$;

revoke all on function public.agent_same_product(text, text, text, text) from public, anon, authenticated;
grant execute on function public.agent_same_product(text, text, text, text) to service_role;

create function public.agent_add_hidden_product(
  p_brand text,
  p_name text,
  p_category text,
  p_release_year integer,
  p_variants jsonb,
  p_reason text,
  p_evidence_urls text[]
)
returns table (product_id uuid, slug text, variants_created integer)
language plpgsql security definer set search_path = '' as $$
declare
  brand_name text := pg_catalog.btrim(coalesce(p_brand, ''));
  product_name text := pg_catalog.btrim(coalesce(p_name, ''));
  product_slug text;
  axes text[];
  evidence_sellers integer;
  variant jsonb;
  variant_label text;
  attributes jsonb;
  attribute record;
  labels text[] := '{}';
  variants_log jsonb := '[]'::jsonb;
  variant_position integer := 0;
  new_product_id uuid;
begin
  if brand_name = '' or pg_catalog.char_length(brand_name) > 80 or brand_name ~ '[[:cntrl:]]' then
    raise exception 'brand is required and must be at most 80 characters';
  end if;
  if product_name = '' or pg_catalog.char_length(product_name) > 120 or product_name ~ '[[:cntrl:]]' then
    raise exception 'name is required and must be at most 120 characters';
  end if;
  if pg_catalog.left(pg_catalog.lower(product_name), pg_catalog.char_length(brand_name) + 1) = pg_catalog.lower(brand_name || ' ') then
    product_name := pg_catalog.btrim(pg_catalog.substr(product_name, pg_catalog.char_length(brand_name) + 2));
  end if;
  if product_name = '' then raise exception 'name must not repeat only the brand'; end if;
  if p_release_year is not null and (p_release_year < 1990 or p_release_year > pg_catalog.date_part('year', pg_catalog.now())::integer + 1) then
    raise exception 'release year is outside the allowed range';
  end if;
  if p_reason is null or pg_catalog.char_length(pg_catalog.btrim(p_reason)) not between 1 and 400 then
    raise exception 'a reason of at most 400 characters is required';
  end if;
  if p_variants is null
     or pg_catalog.jsonb_typeof(p_variants) <> 'array'
     or pg_catalog.jsonb_array_length(p_variants) not between 1 and 20 then
    raise exception 'between 1 and 20 variants are required';
  end if;
  if p_evidence_urls is null or pg_catalog.cardinality(p_evidence_urls) not between 2 and 6 then
    raise exception 'between 2 and 6 seller product URLs are required';
  end if;
  if exists (
    select 1
    from pg_catalog.unnest(p_evidence_urls) as evidence(url)
    where url is null or url !~* '^https?://[^/]+/.+'
  ) then
    raise exception 'evidence must be HTTP product-page URLs';
  end if;
  if not exists (
    select 1 from public.categories c
    where c.slug = p_category and c.active
  ) then
    raise exception 'category is missing or inactive';
  end if;
  select c.variant_axes into axes
  from public.categories c
  where c.slug = p_category and c.active;

  select pg_catalog.count(distinct s.id)::integer into evidence_sellers
  from pg_catalog.unnest(p_evidence_urls) as evidence(url)
  join public.sellers s
    on s.active
    and s.website is not null
    and pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.split_part(pg_catalog.split_part(pg_catalog.regexp_replace(s.website, '^https?://', '', 'i'), '/', 1), ':', 1), '^www\.', ''))
      = pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.split_part(pg_catalog.split_part(pg_catalog.regexp_replace(evidence.url, '^https?://', '', 'i'), '/', 1), ':', 1), '^www\.', ''));
  if evidence_sellers < 2 then
    raise exception 'evidence must come from at least 2 different active sellers';
  end if;

  product_slug := pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.lower(brand_name || ' ' || product_name), '[^a-z0-9]+', '-', 'g'), '-');
  if product_slug = '' or pg_catalog.char_length(product_slug) > 120 then
    raise exception 'brand and name do not produce a valid product slug';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('agent-product:' || pg_catalog.lower(brand_name || ' ' || product_name), 0));
  if exists (
    select 1 from public.products p
    where p.slug = product_slug
       or public.agent_same_product(p.brand, p.name, brand_name, product_name)
  ) then
    raise exception 'a matching product already exists';
  end if;
  if not exists (select 1 from public.jobs j where j.id = 'discover' and j.enabled) then
    raise exception 'discover job is disabled; product was not added';
  end if;

  insert into public.products (slug, name, brand, category, release_year, active)
  values (product_slug, product_name, brand_name, p_category, p_release_year, false)
  returning id into new_product_id;

  for variant in
    select item.value from pg_catalog.jsonb_array_elements(p_variants) as item(value)
  loop
    if pg_catalog.jsonb_typeof(variant) <> 'object'
       or exists (
         select 1 from pg_catalog.jsonb_object_keys(variant) as keys(key)
         where key <> all(array['label', 'attributes'])
       ) then
      raise exception 'variant fields must be limited to label and attributes';
    end if;

    variant_label := pg_catalog.btrim(coalesce(variant ->> 'label', ''));
    attributes := coalesce(variant -> 'attributes', '{}'::jsonb);
    if variant_label = '' or pg_catalog.char_length(variant_label) > 100 or variant_label ~ '[[:cntrl:]]' then
      raise exception 'variant label is required and must be at most 100 characters';
    end if;
    if pg_catalog.lower(variant_label) = any(labels) then
      raise exception 'variant labels must be unique';
    end if;
    if pg_catalog.jsonb_typeof(attributes) <> 'object'
       or exists (
         select 1 from pg_catalog.jsonb_object_keys(attributes) as keys(key)
         where key <> all(axes)
       ) then
      raise exception 'variant attributes must match the category axes';
    end if;
    for attribute in select key, value from pg_catalog.jsonb_each(attributes) as entries(key, value)
    loop
      if pg_catalog.jsonb_typeof(attribute.value) <> 'string'
         or pg_catalog.char_length(pg_catalog.btrim(attribute.value #>> '{}')) not between 1 and 80 then
        raise exception 'variant attribute values must be non-empty strings of at most 80 characters';
      end if;
    end loop;

    insert into public.variants (product_id, label, attributes, official_price, position)
    values (new_product_id, variant_label, attributes, null, variant_position);
    labels := pg_catalog.array_append(labels, pg_catalog.lower(variant_label));
    variants_log := variants_log || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('label', variant_label, 'attributes', attributes));
    variant_position := variant_position + 1;
  end loop;

  insert into public.agent_product_candidates (product_id)
  values (new_product_id);

  insert into public.audit_log (action, detail)
  values (
    'agent.add',
    pg_catalog.jsonb_build_object(
      'agent', 'manager',
      'product_id', new_product_id,
      'slug', product_slug,
      'reason', pg_catalog.btrim(p_reason),
      'evidence', to_jsonb(p_evidence_urls),
      'variants', variants_log
    )
  );

  return query select new_product_id, product_slug, variant_position;
end;
$$;

revoke all on function public.agent_add_hidden_product(text, text, text, integer, jsonb, text, text[]) from public, anon, authenticated;
grant execute on function public.agent_add_hidden_product(text, text, text, integer, jsonb, text, text[]) to service_role;

create function public.agent_publish_ready_candidates()
returns table (product_id uuid, slug text, name text)
language plpgsql security definer set search_path = '' as $$
declare
  slots integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('agent-publish-ready', 0));
  select 5 - pg_catalog.count(*)::integer
  into slots
  from public.audit_log a
  where a.action = 'agent.publish'
    and a.created_at >= (pg_catalog.date_trunc('day', pg_catalog.now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka');

  if slots < 0 then slots := 0; end if;
  if slots = 0 then return; end if;

  return query
  with variant_stats as (
    select v.id, v.product_id,
      pg_catalog.count(distinct s.id) filter (
        where s.id is not null and o.published and o.price > 0
          and o.condition::text = any(c.conditions)
          and (o.expires_at is null or o.expires_at > pg_catalog.now())
      ) as sellers,
      pg_catalog.min(o.price) filter (
        where s.id is not null and o.published and o.price > 0
          and o.condition::text = any(c.conditions)
          and (o.expires_at is null or o.expires_at > pg_catalog.now())
      ) as low,
      pg_catalog.max(o.price) filter (
        where s.id is not null and o.published and o.price > 0
          and o.condition::text = any(c.conditions)
          and (o.expires_at is null or o.expires_at > pg_catalog.now())
      ) as high
    from public.variants v
    left join public.offers o on o.variant_id = v.id
    left join public.sellers s on s.id = o.seller_id and s.active
    join public.products p on p.id = v.product_id
    join public.categories c on c.slug = p.category
    group by v.id, v.product_id
  ), eligible as (
    select p.id
    from public.products p
    join public.categories c on c.slug = p.category and c.active
    join public.agent_product_candidates candidate on candidate.product_id = p.id and candidate.status = 'pending'
    where not p.active
      and p.discovered_at is not null
      and p.discovered_at >= p.discover_requested_at
      and pg_catalog.cardinality(p.images) > 0
      and exists (select 1 from public.variants v where v.product_id = p.id)
      and not exists (
        select 1 from variant_stats stats
        where stats.product_id = p.id
          and (
            stats.sellers < 2
            or stats.low is null
            or stats.high is null
            or stats.high::numeric / nullif(stats.low, 0) > 1.8
          )
      )
      and not exists (
        select 1
        from public.review_queue r
        where r.kind = 'match'
          and (r.status = 'pending' or (r.status = 'approved' and r.applied_at is null))
          and (
            r.payload ->> 'productId' = p.id::text
            or r.payload ->> 'variantId' in (
              select v.id::text from public.variants v where v.product_id = p.id
            )
          )
      )
      and not exists (
        select 1 from public.products other
        where other.id <> p.id
          and public.agent_same_product(other.brand, other.name, p.brand, p.name)
      )
    order by p.popularity desc, p.created_at
    limit slots
  ), updated as (
    update public.products p
    set active = true
    from eligible e
    where p.id = e.id
    returning p.id, p.slug, p.name
  ), logged as (
    insert into public.audit_log (action, detail)
    select
      'agent.publish',
      pg_catalog.jsonb_build_object(
        'agent', 'manager',
        'product_id', u.id,
        'slug', u.slug,
        'reason', 'সব publish gate পাস',
        'evidence', coalesce((
          select pg_catalog.jsonb_agg(distinct o.url)
          from public.variants v
          join public.offers o on o.variant_id = v.id
          join public.sellers s on s.id = o.seller_id and s.active
          join public.products ep on ep.id = v.product_id
          join public.categories ec on ec.slug = ep.category
          where v.product_id = u.id
            and o.published and o.price > 0
            and o.condition::text = any(ec.conditions)
            and (o.expires_at is null or o.expires_at > pg_catalog.now())
            and o.url is not null
        ), '[]'::jsonb)
      )
    from updated u
    returning id
  )
  select u.id, u.slug, u.name
  from updated u
  order by u.name;
end;
$$;

revoke all on function public.agent_publish_ready_candidates() from public, anon, authenticated;
grant execute on function public.agent_publish_ready_candidates() to service_role;
