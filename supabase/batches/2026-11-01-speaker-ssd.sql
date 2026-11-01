-- ব্লুটুথ স্পিকার আর পোর্টেবল SSD-র প্রথম ব্যাচ (১ নভেম্বর ২০২৬)।
-- নতুন দোকান: UCC আর Skyland (workers/stores/index.ts এ কনফিগ যোগ হয়েছে), তাই এখানে তাদের sellers সারিও।
-- প্রতিটা পণ্য কমপক্ষে ২টা কনফিগার-করা দোকানের sitemap-এ আছে (১ নভেম্বরে যাচাই করা):
--   JBL: Gadget & Gear (অফিসিয়াল), Apple Gadgets, Sumash Tech, Vertech, Rio International, Motionview, Skyland
--   Anker Soundcore: Apple Gadgets, Sumash Tech
--   Awei: Star Tech, Kry International, Apple Gadgets, Skyland
--   SSD: Apple Gadgets, Sumash Tech, Global Brand, Star Tech, UCC, Skyland
-- official_price শুধু যেখানে দোকানের পেজ থেকে নিশ্চিত দাম পড়া গেছে; বাকিগুলো discover এর মিডিয়ান-সীমায় যাচাই হবে।
-- insert-এর পরে discover_requested_at ডিফল্ট now() থাকায় পণ্যগুলো pending — worker এর discover দাম খোঁজবে।

insert into sellers (name, kind, website, verified) values
  ('UCC', 'website', 'https://www.ucc.com.bd/', true),
  ('Skyland', 'website', 'https://www.skyland.com.bd/', true)
on conflict do nothing;

insert into products (slug, name, brand, category, release_year, popularity) values
  ('jbl-go-4', 'Go 4', 'JBL', 'speaker', 2024, 75),
  ('jbl-go-5', 'Go 5', 'JBL', 'speaker', 2025, 80),
  ('jbl-clip-4', 'Clip 4', 'JBL', 'speaker', 2022, 60),
  ('jbl-clip-5', 'Clip 5', 'JBL', 'speaker', 2024, 75),
  ('jbl-flip-6', 'Flip 6', 'JBL', 'speaker', 2022, 70),
  ('jbl-flip-7', 'Flip 7', 'JBL', 'speaker', 2025, 85),
  ('jbl-charge-5', 'Charge 5', 'JBL', 'speaker', 2022, 70),
  ('jbl-charge-6', 'Charge 6', 'JBL', 'speaker', 2025, 90),
  ('jbl-xtreme-4', 'Xtreme 4', 'JBL', 'speaker', 2024, 60),
  ('jbl-xtreme-5', 'Xtreme 5', 'JBL', 'speaker', 2025, 70),
  ('jbl-boombox-3', 'Boombox 3', 'JBL', 'speaker', 2022, 55),
  ('jbl-boombox-4', 'Boombox 4', 'JBL', 'speaker', 2026, 60),
  ('anker-soundcore-boom-3i', 'Soundcore Boom 3i', 'Anker', 'speaker', 2025, 65),
  ('anker-soundcore-boom-go-3i', 'Soundcore Boom Go 3i', 'Anker', 'speaker', 2025, 60),
  ('awei-y385', 'Y385 Mini', 'Awei', 'speaker', null, 55),
  ('awei-y669', 'Y669', 'Awei', 'speaker', null, 55),
  ('adata-sc740', 'SC740', 'ADATA', 'ssd', 2024, 50),
  ('adata-sc730', 'SC730', 'ADATA', 'ssd', 2023, 50),
  ('adata-sc735', 'SC735', 'ADATA', 'ssd', 2023, 45),
  ('transcend-esd310c', 'ESD310C', 'Transcend', 'ssd', 2022, 55),
  ('transcend-esd310s', 'ESD310S', 'Transcend', 'ssd', 2023, 50),
  ('kingston-sxs2000', 'SXS2000', 'Kingston', 'ssd', 2023, 50),
  ('crucial-x8', 'X8', 'Crucial', 'ssd', 2021, 50),
  ('corsair-ex100u', 'EX100U', 'Corsair', 'ssd', 2022, 45)
on conflict (slug) do nothing;

-- স্পিকার: এক মডেলে এক দাম, তাই "Standard" ভ্যারিয়েন্ট (ট্রিমারের মতোই); SSD: ধারণক্ষমতার ভ্যারিয়েন্ট।
-- যেসব ভ্যারিয়েন্ট এখনো দুই দোকানে দেখা যায়নি (যেমন Crucial X8 1TB, Kingston SXS2000 1TB/2TB) সেগুলো আগেই নেই
insert into variants (product_id, label, official_price, position)
select p.id, v.label, v.official_price, v.position
from products p
join (values
  ('jbl-go-4', 'Standard', null::int, 1),
  ('jbl-go-5', 'Standard', 5499, 1),
  ('jbl-clip-4', 'Standard', null::int, 1),
  ('jbl-clip-5', 'Standard', 5999, 1),
  ('jbl-flip-6', 'Standard', null::int, 1),
  ('jbl-flip-7', 'Standard', 11999, 1),
  ('jbl-charge-5', 'Standard', null::int, 1),
  ('jbl-charge-6', 'Standard', 15999, 1),
  ('jbl-xtreme-4', 'Standard', null::int, 1),
  ('jbl-xtreme-5', 'Standard', 37999, 1),
  ('jbl-boombox-3', 'Standard', null::int, 1),
  ('jbl-boombox-4', 'Standard', 51999, 1),
  ('anker-soundcore-boom-3i', 'Standard', null::int, 1),
  ('anker-soundcore-boom-go-3i', 'Standard', null::int, 1),
  ('awei-y385', 'Standard', null::int, 1),
  ('awei-y669', 'Standard', null::int, 1),
  ('adata-sc740', '500GB', null::int, 1),
  ('adata-sc740', '1TB', null::int, 2),
  ('adata-sc730', '512GB', null::int, 1),
  ('adata-sc730', '1TB', null::int, 2),
  ('adata-sc735', '1TB', null::int, 1),
  ('adata-sc735', '2TB', null::int, 2),
  ('transcend-esd310c', '256GB', 9999, 1),
  ('transcend-esd310c', '512GB', 15500, 2),
  ('transcend-esd310c', '1TB', 25700, 3),
  ('transcend-esd310s', '512GB', null::int, 1),
  ('transcend-esd310s', '1TB', 26800, 2),
  ('kingston-sxs2000', '500GB', null::int, 1),
  ('crucial-x8', '2TB', null::int, 1),
  ('corsair-ex100u', '1TB', null::int, 1)
) as v(slug, label, official_price, position) on v.slug = p.slug
where not exists (
  select 1 from variants existing where existing.product_id = p.id and existing.label = v.label
);
