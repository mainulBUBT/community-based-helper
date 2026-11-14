-- ২০২৬-১১-১৪: SoundPEATS C30 — ৯টা চলতি দোকানে পাওয়া গেছে, ৮টায় স্টকে আছে (Dolbear-এ স্টক নেই)।
-- পাতা worker-এর reader দিয়ে লাইভ পড়া: Star Tech ৳2650 (official), Sumash Tech ৳2599 (আগে ৳2850), Kry ৳2649,
-- Apple Gadgets ৳2699, Diamu ৳2650 (আগে ৳2900), Gadget Breeze ৳2500 (আগে ৳2529), Dolbear ৳2549 (স্টক-আউট),
-- Shei Tech ৳2650 (আগে ৳3000), Umrelo ৳2550 (আগে ৳2990)। দামের ব্যবধান ২৫০০–২৬৯৯, নিয়মের ১.৮ গুণের ভেতরে।
-- এক মডেলে এক দাম, তাই "Standard" ভ্যারিয়েন্ট (Q3 Pro-র মতো)। official_price null: বাংলাদেশে ব্র্যান্ডের ঘোষিত দাম নেই।
-- স্পেক আর ছবি Star Tech/অন্য দোকানের আসল পাতার CDN লিংক থেকে। নতুন পণ্য হওয়ায় trigger নিজেই discover লাইনে দেয়।

begin;

insert into products (slug, name, brand, category, release_year, popularity, images, specs, specs_source) values
  (
    'soundpeats-c30', 'C30', 'SoundPEATS', 'earbuds', 2025, 90,
    '{"https://www.startech.com.bd/image/cache/catalog/earbuds/soundpeats/c30/c30-05-1200x630.webp","https://sumashtech.sgp1.cdn.digitaloceanspaces.com/product-image/3674/SoundPEATS_C30.webp","https://adminapi.applegadgetsbd.com/storage/media/large/SoundPeats-C30-Hi-Res-LDAC-Hybrid-ANC-EarbudsSDGb-6553.png","https://images.kryinternational.com/uploads/soundpeats-c30-anc-earbuds.jpg","https://gadgetbreeze.com.bd/wp-content/uploads/2025/11/SOUNDPEATS-C30-Hi-Res-LDAC-Hybrid-ANC-Earbuds_10.jpg"}',
    $specs$[
      {"group":"Main Feature","items":[
        {"label":"Signal/Noise","value":"Hybrid ANC (-52dB Max) with Transparency Mode"},
        {"label":"Connection Type","value":"Bluetooth: V6.0"},
        {"label":"Microphone","value":"6-Mic AI ENC with Wind Resistance"},
        {"label":"Frequency","value":"20Hz–40KHz"},
        {"label":"Duration","value":"Total Playtime: Up to 52 Hours (with case), 10-Minute Fast Charge for 3 Hours"},
        {"label":"Others","value":"Waterproof Level: IP54, Hi-Res LDAC Audio"}
      ]},
      {"group":"Physical Specification","items":[
        {"label":"Drivers","value":"12mm Dynamic Driver"}
      ]},
      {"group":"Warranty","items":[
        {"label":"Warranty","value":"6 Months"}
      ]}
    ]$specs$::jsonb,
    'https://www.startech.com.bd/soundpeats-c30-earbuds'
  )
on conflict (slug) do nothing;

insert into variants (product_id, label, position)
select p.id, 'Standard', 1
from products p
where p.slug = 'soundpeats-c30'
  and not exists (select 1 from variants existing where existing.product_id = p.id and existing.label = 'Standard');

insert into offers (variant_id, seller_id, condition, price, old_price, in_stock, url, source, published, checked_at)
select v.id, s.id, o.condition::offer_condition, o.price, o.old_price, o.in_stock, o.url, 'site', true, now()
from (values
  ('startech.com.bd', 'official', 2650, null::int, true, 'https://www.startech.com.bd/soundpeats-c30-earbuds'),
  ('sumashtech.com', 'unofficial', 2599, 2850, true, 'https://www.sumashtech.com/product/soundpeats-c30'),
  ('kryinternational.com', 'unofficial', 2649, null::int, true, 'https://kryinternational.com/products/soundpeats-c30-anc-earbuds'),
  ('applegadgetsbd.com', 'unofficial', 2699, null::int, true, 'https://www.applegadgetsbd.com/product/soundpeats-c30-hi-res-ldac-hybrid-anc-earbuds'),
  ('diamu.com.bd', 'unofficial', 2650, 2900, true, 'https://diamu.com.bd/product/soundpeats-c30-earbuds/'),
  ('gadgetbreeze.com.bd', 'unofficial', 2500, 2529, true, 'https://gadgetbreeze.com.bd/product/soundpeats-c30-hi-res-ldac-hybrid-anc-earbuds/'),
  ('dolbear.com.bd', 'unofficial', 2549, null::int, false, 'https://dolbear.com.bd/products/soundpeats-c30'),
  ('sheitech.com.bd', 'unofficial', 2650, 3000, true, 'https://sheitech.com.bd/product/soundpeats-c30-best-ldac-hybrid-anc-tws/'),
  ('umrelo.com.bd', 'official', 2550, 2990, true, 'https://umrelo.com.bd/product/soundpeats-c30/')
) as o(host, condition, price, old_price, in_stock, url)
join products p on p.slug = 'soundpeats-c30'
join variants v on v.product_id = p.id and v.label = 'Standard'
join lateral (select id from sellers where website ilike '%' || o.host || '%' order by created_at limit 1) s on true
where not exists (select 1 from offers where url = o.url)
on conflict (variant_id, seller_id, condition) do nothing;

commit;
