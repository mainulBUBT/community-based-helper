-- বেবি পণ্য: ডায়াপার (সাইজ আর প্যাকে কয়টা ধরে ভার্সন) আর বেবি কেয়ার (লোশন, ক্রিম, তেল, ওয়াইপস; ml/g ধরে)
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('baby', 'বেবি পণ্য', 'Baby', 'baby', '{capacity}', 24, null, false, '{official}', false, false)
on conflict (slug) do nothing;

insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('diapers', 'ডায়াপার', 'Diapers', 'baby', '{size,capacity}', 25, 'baby', false, '{official}', false, false),
  ('baby-care', 'বেবি কেয়ার', 'Baby Care', 'baby', '{capacity}', 26, 'baby', false, '{official}', false, false)
on conflict (slug) do nothing;
