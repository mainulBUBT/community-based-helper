-- ট্রিমার: এক মডেলে এক দাম (রং বা ওয়ারেন্টি আলাদা অপশন), তাই ভার্সনের ঘর নেই
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('trimmer', 'ট্রিমার', 'Trimmers', 'scissors', '{}', 28, null, true, '{official,unofficial}', false, false)
on conflict (slug) do nothing;
