alter table public.places
  add column description text check (char_length(description) <= 160);
