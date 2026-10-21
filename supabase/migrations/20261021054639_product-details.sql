create table categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  name_en text not null,
  icon text not null default 'package',
  parent text references categories (slug) on update cascade,
  variant_axes text[] not null default '{}' check (variant_axes <@ '{chip,ram,storage,size,connectivity,edition,color}'),
  position int not null default 0,
  active boolean not null default true
);

alter table categories enable row level security;
create policy "public read" on categories for select using (true);
create policy "admin write" on categories for all using (is_admin()) with check (is_admin());

insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('mobile', 'মোবাইল', 'Mobiles', 'smartphone', '{ram,storage}', 1, null),
  ('laptop', 'ল্যাপটপ', 'Laptops', 'laptop', '{chip,ram,storage}', 2, null),
  ('tablet', 'ট্যাবলেট', 'Tablets', 'tablet', '{storage,connectivity}', 3, null),
  ('desktop', 'ডেস্কটপ', 'Desktops', 'monitor', '{chip,ram,storage}', 4, null),
  ('watch', 'স্মার্টওয়াচ', 'Smartwatches', 'watch', '{size,connectivity}', 5, null),
  ('audio', 'অডিও', 'Audio', 'headphones', '{color}', 6, null);
insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('earbuds', 'ইয়ারবাড', 'Earbuds', 'headphones', '{color}', 7, 'audio'),
  ('headphones', 'হেডফোন', 'Headphones', 'headphones', '{color}', 8, 'audio');

alter table products alter column category type text
  using (case category::text when 'apple' then 'mobile' else category::text end);
drop type product_category;
alter table products add constraint products_category_fkey
  foreign key (category) references categories (slug) on update cascade;

alter table products
  add column colors text[] not null default '{}',
  add column regions text[] not null default '{}',
  add column description text,
  add column description_en text,
  add column specs jsonb not null default '[]',
  add column specs_source text;

alter table variants
  add column attributes jsonb not null default '{}',
  add column sku text;

