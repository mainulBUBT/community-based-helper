-- Widen the allowed version fields and make category slugs immutable.

alter table categories drop constraint if exists categories_variant_axes_check;
alter table categories add constraint categories_variant_axes_check
  check (variant_axes <@ '{chip,ram,storage,size,connectivity,edition,color,gpu,cpu,resolution,battery,capacity}');

-- laptop/desktop already carry cpu/gpu attributes in the catalog data
update categories set variant_axes = '{chip,ram,storage,cpu,gpu}' where slug = 'laptop';
update categories set variant_axes = '{chip,ram,storage,cpu,gpu}' where slug = 'desktop';

create or replace function categories_slug_immutable() returns trigger
language plpgsql as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'category slug cannot be changed (%), create a new category instead', old.slug;
  end if;
  return new;
end $$;

drop trigger if exists categories_slug_immutable on categories;
create trigger categories_slug_immutable
  before update of slug on categories
  for each row execute function categories_slug_immutable();
