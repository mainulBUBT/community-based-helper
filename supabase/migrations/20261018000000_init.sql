create type public.place_status as enum ('new', 'confirmed', 'disputed', 'hidden');
create type public.user_role as enum ('user', 'moderator', 'admin');

create table public.categories (
  id text primary key,
  name_bn text not null,
  short_bn text not null,
  is_market boolean not null default false,
  sort_order smallint not null default 0
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories,
  parent_id uuid references public.places on delete cascade,
  kind text not null default 'place' check (kind in ('place', 'market', 'shop')),
  name text not null check (char_length(name) between 2 and 120),
  area text check (char_length(area) <= 80),
  floor text check (char_length(floor) <= 30),
  unit text check (char_length(unit) <= 30),
  lat double precision not null check (lat between 20 and 27),
  lng double precision not null check (lng between 88 and 93),
  phone text check (phone ~ '^[0-9+ -]{3,20}$'),
  open_24h boolean not null default false,
  status public.place_status not null default 'new',
  verified_at timestamptz,
  added_by uuid references public.profiles on delete set null,
  owner_added boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind <> 'shop' or parent_id is not null)
);

create index places_category_idx on public.places (category_id);
create index places_parent_idx on public.places (parent_id) where parent_id is not null;

create table public.purposes (
  id text primary key,
  name_bn text not null unique,
  sort_order smallint not null default 0
);

create table public.place_purposes (
  place_id uuid not null references public.places on delete cascade,
  purpose_id text not null references public.purposes,
  primary key (place_id, purpose_id)
);

create index place_purposes_purpose_idx on public.place_purposes (purpose_id);

create table public.opening_hours (
  place_id uuid not null references public.places on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_min smallint not null check (opens_min between 0 and 1439),
  closes_min smallint not null check (closes_min between 1 and 1440),
  primary key (place_id, weekday, opens_min)
);

create table public.fact_votes (
  place_id uuid not null references public.places on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  field text not null check (field in ('all', 'hours', 'weekly_off', 'phone', 'location', 'shops', 'closed_down')),
  is_correct boolean not null,
  correction text check (char_length(correction) <= 200),
  created_at timestamptz not null default now(),
  primary key (place_id, user_id, field)
);

create table public.purpose_votes (
  place_id uuid not null,
  purpose_id text not null,
  user_id uuid not null references public.profiles on delete cascade,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (place_id, purpose_id, user_id),
  foreign key (place_id, purpose_id) references public.place_purposes on delete cascade
);

create table public.saved_places (
  user_id uuid not null references public.profiles on delete cascade,
  place_id uuid not null references public.places on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.mod_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles on delete set null,
  action text not null,
  place_id uuid references public.places on delete set null,
  target_user_id uuid references public.profiles on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create function public.is_active_user() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and not is_banned
  );
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('moderator', 'admin') and not is_banned
  );
$$;

create function public.purpose_confirmations()
returns table (place_id uuid, purpose_id text, confirmed bigint)
language sql stable security definer set search_path = ''
as $$
  select place_id, purpose_id, count(*) filter (where is_correct)
  from public.purpose_votes
  group by place_id, purpose_id;
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 60));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.opening_hours enable row level security;
alter table public.purposes enable row level security;
alter table public.place_purposes enable row level security;
alter table public.purpose_votes enable row level security;
alter table public.fact_votes enable row level security;
alter table public.saved_places enable row level security;
alter table public.mod_log enable row level security;

create policy "categories are public" on public.categories
  for select using (true);

create policy "visible places are public" on public.places
  for select using (status <> 'hidden' or (select public.is_staff()));
create policy "members add new places" on public.places
  for insert to authenticated
  with check (
    added_by = (select auth.uid())
    and status = 'new'
    and verified_at is null
    and (select public.is_active_user())
  );
create policy "staff edit places" on public.places
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete places" on public.places
  for delete to authenticated using ((select public.is_staff()));

create policy "hours are public" on public.opening_hours
  for select using (true);
create policy "members add hours to their new place" on public.opening_hours
  for insert to authenticated
  with check (exists (
    select 1 from public.places p
    where p.id = place_id and p.added_by = (select auth.uid()) and p.status = 'new'
  ));
create policy "staff manage hours" on public.opening_hours
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "purposes are public" on public.purposes
  for select using (true);
create policy "staff manage purposes" on public.purposes
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "place purposes are public" on public.place_purposes
  for select using (true);
create policy "members add purposes to their new place" on public.place_purposes
  for insert to authenticated
  with check (exists (
    select 1 from public.places p
    where p.id = place_id and p.added_by = (select auth.uid()) and p.status = 'new'
  ));
create policy "staff manage place purposes" on public.place_purposes
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "members read own purpose votes" on public.purpose_votes
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "members vote on purposes" on public.purpose_votes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));
create policy "members change own purpose vote" on public.purpose_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));
create policy "staff clear purpose votes" on public.purpose_votes
  for delete to authenticated using ((select public.is_staff()));

create policy "members read own votes" on public.fact_votes
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "members vote" on public.fact_votes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));
create policy "members change own vote" on public.fact_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));
create policy "staff clear votes" on public.fact_votes
  for delete to authenticated using ((select public.is_staff()));

create policy "members manage own saved" on public.saved_places
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "staff read log" on public.mod_log
  for select to authenticated using ((select public.is_staff()));
create policy "staff write log" on public.mod_log
  for insert to authenticated
  with check (actor_id = (select auth.uid()) and (select public.is_staff()));

grant select on public.categories, public.places, public.opening_hours, public.purposes, public.place_purposes to anon, authenticated;
grant insert, update, delete on public.places, public.opening_hours, public.purposes, public.place_purposes to authenticated;
grant select, insert, update, delete on public.fact_votes, public.purpose_votes, public.saved_places to authenticated;
grant execute on function public.purpose_confirmations() to anon, authenticated;
grant select, insert on public.mod_log to authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
