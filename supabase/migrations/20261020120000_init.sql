create type product_category as enum ('mobile', 'apple', 'watch');
create type seller_kind as enum ('website', 'shop', 'group');
create type offer_condition as enum ('official', 'unofficial', 'used');
create type offer_source as enum ('site', 'seller', 'user', 'admin');
create type review_kind as enum ('match', 'anomaly', 'submission');
create type review_status as enum ('pending', 'approved', 'rejected');

create table admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  category product_category not null,
  release_year int,
  popularity int not null default 0,
  created_at timestamptz not null default now()
);

create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  label text not null,
  official_price int,
  position int not null default 0
);

create table sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind seller_kind not null,
  website text,
  phone text,
  whatsapp text,
  facebook text,
  area text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint seller_contact check (website is not null or phone is not null)
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references variants on delete cascade,
  seller_id uuid not null references sellers on delete cascade,
  condition offer_condition not null default 'official',
  region text,
  price int not null check (price > 0),
  old_price int,
  in_stock boolean,
  url text,
  source offer_source not null,
  published boolean not null default true,
  checked_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (variant_id, seller_id, condition)
);

create table price_history (
  offer_id uuid not null references offers on delete cascade,
  price int not null,
  seen_at timestamptz not null default now(),
  primary key (offer_id, seen_at)
);

create table promos (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers on delete cascade,
  kind text not null,
  text text not null,
  scope text,
  ends_on date,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table review_queue (
  id uuid primary key default gen_random_uuid(),
  kind review_kind not null,
  status review_status not null default 'pending',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table jobs (
  id text primary key,
  name text not null,
  runner text not null,
  schedule text not null,
  enabled boolean not null default true,
  run_requested_at timestamptz,
  last_run_at timestamptz,
  last_status text,
  last_message text
);

create table job_runs (
  id bigint generated always as identity primary key,
  job_id text not null references jobs on delete cascade,
  status text not null,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid default auth.uid(),
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table site_settings (
  id boolean primary key default true check (id),
  value jsonb not null default '{}'
);

create table private_settings (
  id boolean primary key default true check (id),
  value jsonb not null default '{}'
);

create table page_views (
  id bigint generated always as identity primary key,
  visitor text not null,
  path text not null,
  product_id uuid references products on delete set null,
  referrer text,
  created_at timestamptz not null default now()
);

create index offers_variant_idx on offers (variant_id) where published;
create index price_history_offer_idx on price_history (offer_id, seen_at desc);
create index page_views_created_idx on page_views (created_at desc);
create index review_queue_pending_idx on review_queue (created_at) where status = 'pending';

alter table admins enable row level security;
alter table products enable row level security;
alter table variants enable row level security;
alter table sellers enable row level security;
alter table offers enable row level security;
alter table price_history enable row level security;
alter table promos enable row level security;
alter table review_queue enable row level security;
alter table jobs enable row level security;
alter table job_runs enable row level security;
alter table audit_log enable row level security;
alter table site_settings enable row level security;
alter table private_settings enable row level security;
alter table page_views enable row level security;

create policy "public read" on products for select using (true);
create policy "public read" on variants for select using (true);
create policy "public read" on sellers for select using (active or is_admin());
create policy "public read" on offers for select using ((published and (expires_at is null or expires_at > now())) or is_admin());
create policy "public read" on price_history for select using (true);
create policy "public read" on promos for select using (active or is_admin());
create policy "public read" on site_settings for select using (true);

create policy "admin write" on products for all using (is_admin()) with check (is_admin());
create policy "admin write" on variants for all using (is_admin()) with check (is_admin());
create policy "admin write" on sellers for all using (is_admin()) with check (is_admin());
create policy "admin write" on offers for all using (is_admin()) with check (is_admin());
create policy "admin write" on price_history for all using (is_admin()) with check (is_admin());
create policy "admin write" on promos for all using (is_admin()) with check (is_admin());
create policy "admin all" on review_queue for all using (is_admin()) with check (is_admin());
create policy "admin all" on jobs for all using (is_admin()) with check (is_admin());
create policy "admin all" on job_runs for all using (is_admin()) with check (is_admin());
create policy "admin all" on audit_log for all using (is_admin()) with check (is_admin());
create policy "admin write" on site_settings for all using (is_admin()) with check (is_admin());
create policy "admin all" on private_settings for all using (is_admin()) with check (is_admin());
create policy "admin read" on page_views for select using (is_admin());
create policy "admin read" on admins for select using (is_admin());

create policy "anyone can submit a price" on review_queue for insert
  with check (kind = 'submission' and status = 'pending');

create policy "anyone can log a view" on page_views for insert
  with check (char_length(path) <= 300 and char_length(visitor) <= 64);

create function visitor_stats(days int default 30)
returns table (day date, views bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select date_trunc('day', created_at)::date, count(*), count(distinct visitor)
  from page_views
  where is_admin() and created_at > now() - make_interval(days => days)
  group by 1 order by 1;
$$;

create function top_pages(days int default 30, max_rows int default 20)
returns table (path text, views bigint, visitors bigint)
language sql stable security definer set search_path = public as $$
  select path, count(*), count(distinct visitor)
  from page_views
  where is_admin() and created_at > now() - make_interval(days => days)
  group by 1 order by 2 desc limit max_rows;
$$;

create function record_price() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into price_history (offer_id, price) values (new.id, new.price)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger offers_price_history after insert or update of price on offers
  for each row execute function record_price();

insert into site_settings (value) values (jsonb_build_object(
  'name', 'সাশ্রয়',
  'tagline', 'মোবাইল, Apple আর স্মার্টওয়াচের দাম এক জায়গায়',
  'phone', null,
  'email', null,
  'facebook', null,
  'logoUrl', null,
  'seoTitle', 'সাশ্রয়: মোবাইল আর গ্যাজেটের দাম তুলনা',
  'seoDescription', 'বাংলাদেশের দোকানগুলোতে মোবাইল, iPhone, MacBook আর স্মার্টওয়াচের দাম পাশাপাশি দেখুন।',
  'cloudflareAnalyticsToken', null
));

insert into private_settings (value) values (jsonb_build_object(
  'llm', jsonb_build_object('baseUrl', 'https://generativelanguage.googleapis.com/v1beta/openai/', 'model', 'gemini-2.5-flash', 'apiKey', null),
  'telegramBotToken', null,
  'alertChatId', null
));

insert into jobs (id, name, runner, schedule) values
  ('prices', 'দাম আনা', 'Supabase pg_cron', 'প্রতি ১৫ মিনিটে'),
  ('js-stores', 'JavaScript নির্ভর দোকান', 'GitHub Actions', 'দিনে দুবার'),
  ('discover', 'নতুন পণ্য খোঁজা আর মেলানো', 'GitHub Actions', 'প্রতি রাতে'),
  ('promos', 'অফার পড়া', 'Supabase pg_cron', 'দিনে একবার'),
  ('rebuild', 'সাইট নতুন করে বানানো (SEO)', 'GitHub Actions', 'প্রতি রাতে');
