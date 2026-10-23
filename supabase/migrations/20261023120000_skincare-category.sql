-- Skincare products carry one variant per size (ml/g), so the category uses the capacity axis.
insert into categories (slug, name, name_en, icon, variant_axes, position, parent) values
  ('skincare', 'স্কিনকেয়ার', 'Skincare', 'sparkles', '{capacity}', 13, null)
on conflict (slug) do nothing;
