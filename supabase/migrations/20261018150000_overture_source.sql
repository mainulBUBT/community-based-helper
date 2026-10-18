alter table public.places
  drop constraint places_source_check,
  add constraint places_source_check check (source in ('community', 'osm', 'overture')),
  add column website text check (website ~ '^https?://' and char_length(website) <= 200);
