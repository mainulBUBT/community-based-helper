-- খেজুরের গুড়: ব্র্যান্ডের প্যাক (পাটালি, ঝোলা, কিউব, পাউডার), ওজন ধরে ভার্সন; মধুর মতো খাঁটি-দাবি দোকানের, তাই যাচাইয়ের নোট
insert into categories (slug, name, name_en, icon, variant_axes, position, parent, warranty, conditions, verify_note, quality_note) values
  ('date-jaggery', 'খেজুরের গুড়', 'Date Jaggery', 'cooking-pot', '{capacity}', 27, null, false, '{official}', true, false)
on conflict (slug) do nothing;
