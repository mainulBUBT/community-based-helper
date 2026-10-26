-- পানির ফিল্টারের এক মডেলে এক দাম, তাই ভার্সনের ঘর নেই
insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('water-purifier', 'পানির ফিল্টার', 'Water Purifiers', 'droplet', '{}', 20, null)
on conflict (slug) do nothing;
