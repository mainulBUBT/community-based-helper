-- admin check without a mutable search_path
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- anonymous price submissions: small, fresh, pending only, and a global rate cap
alter table review_queue add constraint review_payload_small
  check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 4096) not valid;

drop policy "anyone can submit a price" on review_queue;
create policy "anyone can submit a price" on review_queue for insert to anon, authenticated
  with check (
    kind = 'submission' and status = 'pending'
    and resolved_at is null and applied_at is null
    and created_at > now() - interval '1 minute'
  );

create function limit_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.review_queue where kind = 'submission' and created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'too many submissions, try again later';
  end if;
  return new;
end;
$$;

create trigger review_queue_rate_limit before insert on review_queue
  for each row when (new.kind = 'submission') execute function limit_submissions();

-- page views: bounded rows, no backdating
alter table page_views add constraint page_views_referrer_len
  check (char_length(coalesce(referrer, '')) <= 255) not valid;

drop policy "anyone can log a view" on page_views;
create policy "anyone can log a view" on page_views for insert to anon, authenticated
  with check (
    char_length(path) <= 300 and char_length(visitor) <= 64
    and char_length(coalesce(referrer, '')) <= 255
    and created_at > now() - interval '1 minute'
  );

-- stats are admin only, capped
create or replace function top_pages(days int default 30, max_rows int default 20)
returns table (path text, views bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select path, count(*), count(distinct visitor)
  from page_views
  where is_admin() and created_at > now() - make_interval(days => least(days, 365))
  group by 1 order by 2 desc limit least(max_rows, 100);
$$;

revoke execute on function visitor_stats(int) from public, anon;
revoke execute on function top_pages(int, int) from public, anon;
grant execute on function visitor_stats(int) to authenticated;
grant execute on function top_pages(int, int) to authenticated;

-- price history only for offers the reader can see
drop policy "public read" on price_history;
create policy "public read" on price_history for select
  using (exists (select 1 from offers o where o.id = offer_id));

-- stored links must be web links
alter table offers add constraint offers_url_http check (url is null or url ~* '^https?://') not valid;
alter table sellers add constraint sellers_website_http check (website is null or website ~* '^https?://') not valid;
alter table sellers add constraint sellers_facebook_http check (facebook is null or facebook ~* '^https?://') not valid;
alter table products add constraint products_specs_source_http check (specs_source is null or specs_source ~* '^https?://') not valid;
