alter table public.places
  add column source text not null default 'community' check (source in ('community', 'osm')),
  add column source_ref text;

create unique index places_source_ref_idx on public.places (source, source_ref) where source_ref is not null;

drop policy "members add new places" on public.places;
create policy "members add new places" on public.places
  for insert to authenticated
  with check (
    added_by = (select auth.uid())
    and status = 'new'
    and verified_at is null
    and source = 'community'
    and (select public.is_active_user())
  );
