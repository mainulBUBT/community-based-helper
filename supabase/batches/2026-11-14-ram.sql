-- ২০২৬-১১-১৪: RAM-এর প্রথম ব্যাচ — ১৪টা পণ্য, ২১টা ভার্সন, ৭২টা দাম (এক্সেসরিজের নিচে `ram`; আগে migration 20261114050429_ram-category.sql)।
-- বাছাই: প্রযুক্তি-পণ্যের সব কনফিগার-করা দোকানের তালিকা (Star Tech-এর RAM ক্যাটাগরিসহ) থেকে ৩,২৫২টা RAM-লিংক গুনে, প্রতিটা মডেল কয়টা দোকানে আছে।
-- দাম: প্রতিটা পাতা worker-এর reader দিয়ে পড়া, শিরোনামের GB আর MHz ভার্সনের সাথে মিলিয়ে; শুধু স্টকে থাকা দাম, কারণ স্টক-আউট পাতায় পুরনো দাম থাকে, এখনকার চেয়ে অনেক কম।
-- প্রতিটা ভার্সন অন্তত ২টা দোকানে স্টকে। বাদ: G.Skill Ripjaws DDR4 Laptop আর Transcend JetRAM DDR5 Laptop (২টা দোকানে স্টকে নেই), আর ২টার কম দোকানে স্টকে থাকা ৭টা ভার্সন।
-- দোকান: Apple Gadgets, Computer Village, Computer Vision, Global Brand, Onix Computer, PC House, Skyland, Star Tech। Computer Village (503) আর UCC (দাম JavaScript-এ) এর বেশিরভাগ পাতা পড়া যায়নি; discover পরে ধরবে।
-- RGB আর সাধারণ মডেল আলাদা পণ্য; দোকানভেদে CL (CL30/CL36) আলাদা হলেও এক ভার্সনে, সবচেয়ে কম দাম। নামে "Laptop": দোকানগুলো ল্যাপটপ RAM-এর শিরোনামে সবাই "Laptop" লেখে।
-- ভার্সন লেবেলে ধারণক্ষমতা আর স্পিড (SSD-র মতো attributes ছাড়া)। একই লিংক বা দোকান-ভার্সন আগে থাকলে কিছু হয় না; স্টক আর দাম পরের prices run হালনাগাদ করবে।
begin;

insert into products (slug, name, brand, category, release_year, popularity) values
  ('kingston-fury-beast-ddr5', 'Fury Beast DDR5', 'Kingston', 'ram', 2021, 85),
  ('kingston-fury-beast-ddr4', 'Fury Beast DDR4', 'Kingston', 'ram', 2021, 85),
  ('g-skill-trident-z5-rgb-ddr5', 'Trident Z5 RGB DDR5', 'G.Skill', 'ram', 2021, 75),
  ('corsair-vengeance-rgb-ddr5', 'Vengeance RGB DDR5', 'Corsair', 'ram', 2021, 75),
  ('corsair-vengeance-ddr5', 'Vengeance DDR5', 'Corsair', 'ram', 2021, 70),
  ('corsair-vengeance-lpx-ddr4', 'Vengeance LPX DDR4', 'Corsair', 'ram', 2015, 80),
  ('teamgroup-t-force-delta-rgb-ddr5', 'T-Force Delta RGB DDR5', 'TeamGroup', 'ram', 2021, 75),
  ('g-skill-flare-x5-ddr5', 'Flare X5 DDR5', 'G.Skill', 'ram', 2022, 70),
  ('g-skill-trident-z-rgb-ddr4', 'Trident Z RGB DDR4', 'G.Skill', 'ram', 2017, 70),
  ('lexar-thor-ddr4', 'Thor DDR4', 'Lexar', 'ram', 2021, 70),
  ('teamgroup-t-force-vulcan-z-ddr4', 'T-Force Vulcan Z DDR4', 'TeamGroup', 'ram', 2019, 65),
  ('corsair-vengeance-ddr4-laptop', 'Vengeance DDR4 Laptop', 'Corsair', 'ram', 2016, 75),
  ('netac-basic-ddr4-laptop', 'Basic DDR4 Laptop', 'Netac', 'ram', 2019, 65),
  ('g-skill-ripjaws-ddr5-laptop', 'Ripjaws DDR5 Laptop', 'G.Skill', 'ram', 2022, 60)
on conflict (slug) do nothing;

insert into variants (product_id, label, position)
select p.id, v.label, v.position
from products p
join (values
  ('kingston-fury-beast-ddr5', '8GB 5600MHz', 1),
  ('kingston-fury-beast-ddr5', '16GB 6000MHz', 2),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 1),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 2),
  ('g-skill-trident-z5-rgb-ddr5', '32GB 6000MHz', 1),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 1),
  ('corsair-vengeance-rgb-ddr5', '32GB 6000MHz', 2),
  ('corsair-vengeance-ddr5', '16GB 6000MHz', 1),
  ('corsair-vengeance-lpx-ddr4', '8GB 3200MHz', 1),
  ('corsair-vengeance-lpx-ddr4', '16GB 3200MHz', 2),
  ('teamgroup-t-force-delta-rgb-ddr5', '16GB 6000MHz', 1),
  ('teamgroup-t-force-delta-rgb-ddr5', '32GB 6000MHz', 2),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 1),
  ('g-skill-trident-z-rgb-ddr4', '16GB 3200MHz', 1),
  ('lexar-thor-ddr4', '8GB 3200MHz', 1),
  ('lexar-thor-ddr4', '16GB 3200MHz', 2),
  ('teamgroup-t-force-vulcan-z-ddr4', '8GB 3200MHz', 1),
  ('corsair-vengeance-ddr4-laptop', '8GB 3200MHz', 1),
  ('netac-basic-ddr4-laptop', '8GB 3200MHz', 1),
  ('netac-basic-ddr4-laptop', '16GB 3200MHz', 2),
  ('g-skill-ripjaws-ddr5-laptop', '16GB 4800MHz', 1)
) as v(slug, label, position) on v.slug = p.slug
where not exists (
  select 1 from variants existing where existing.product_id = p.id and existing.label = v.label
);

insert into offers (variant_id, seller_id, condition, price, old_price, in_stock, url, source, published, checked_at)
select v.id, s.id, o.condition::offer_condition, o.price, o.old_price, true, o.url, 'site', true, now() - interval '7 days'
from (values
  ('corsair-vengeance-ddr4-laptop', '8GB 3200MHz', 'skyland.com.bd', 'official', 8400, null::int, 'https://www.skyland.com.bd/corsair-vengeance-8gb-ddr4-3200mhz-sodimm-laptop-ram'),
  ('corsair-vengeance-ddr4-laptop', '8GB 3200MHz', 'startech.com.bd', 'official', 8400, null::int, 'https://www.startech.com.bd/corsair-vengeance-8gb-ddr4-3200mhz-sodimm-laptop-ram'),
  ('corsair-vengeance-ddr5', '16GB 6000MHz', 'pchouse.com.bd', 'official', 30000, null::int, 'https://www.pchouse.com.bd/corsair-vengeance-16gb-ddr5-6000mhz-desktop-ram'),
  ('corsair-vengeance-ddr5', '16GB 6000MHz', 'computervision.com.bd', 'official', 35000, null::int, 'https://computervision.com.bd/corsair-vengeance-16gb-ddr5-6000mhz-cl28-desktop-ram'),
  ('corsair-vengeance-ddr5', '16GB 6000MHz', 'skyland.com.bd', 'official', 35499, null::int, 'https://www.skyland.com.bd/corsair-vengeance-16gb-ddr5-6000mhz-cl36-desktop-ram'),
  ('corsair-vengeance-ddr5', '16GB 6000MHz', 'startech.com.bd', 'official', 35500, null::int, 'https://www.startech.com.bd/corsair-vengeance-16gb-ddr5-6000mhz-cl36-desktop-ram'),
  ('corsair-vengeance-lpx-ddr4', '8GB 3200MHz', 'computervillage.com.bd', 'official', 7500, null::int, 'https://www.computervillage.com.bd/corsair-vengeance-lpx-8gb-ddr4-3200mhz-d'),
  ('corsair-vengeance-lpx-ddr4', '8GB 3200MHz', 'onixbd.com', 'official', 8200, null::int, 'https://www.onixbd.com/corsair-vengeance-lpx-8gb-ddr4-dram-3200mhz-ram'),
  ('corsair-vengeance-lpx-ddr4', '8GB 3200MHz', 'computervision.com.bd', 'official', 8300, null::int, 'https://computervision.com.bd/corsair-vengeance-lpx-8gb-3200mhz-ddr4-desktop-ram'),
  ('corsair-vengeance-lpx-ddr4', '8GB 3200MHz', 'startech.com.bd', 'official', 8700, null::int, 'https://www.startech.com.bd/corsair-vengeance-lpx-8gb-3200mhz'),
  ('corsair-vengeance-lpx-ddr4', '16GB 3200MHz', 'onixbd.com', 'official', 14000, null::int, 'https://www.onixbd.com/corsair-vengeance-lpx-16gb-1-x-16gb-ddr4-dram-3200mhz-ram'),
  ('corsair-vengeance-lpx-ddr4', '16GB 3200MHz', 'computervision.com.bd', 'official', 16900, null::int, 'https://computervision.com.bd/corsair-vengeance-lpx-16gb-ddr4-dram-3200mhz-ram'),
  ('corsair-vengeance-lpx-ddr4', '16GB 3200MHz', 'startech.com.bd', 'official', 17500, null::int, 'https://www.startech.com.bd/corsair-16gb-3200mhz-ram'),
  ('corsair-vengeance-lpx-ddr4', '16GB 3200MHz', 'computervillage.com.bd', 'official', 18000, null::int, 'https://www.computervillage.com.bd/corsair-vengeance-lpx-16gb-ddr4-3200mhz'),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 'pchouse.com.bd', 'official', 31000, 33000, 'https://www.pchouse.com.bd/corsair-vengeance-rgb-16gb-ddr5-6000mhz-ram'),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 'startech.com.bd', 'official', 34999, null::int, 'https://www.startech.com.bd/corsair-vengeance-rgb-16gb-ddr5-6000mhz-ram'),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 'onixbd.com', 'official', 35000, null::int, 'https://www.onixbd.com/corsair-vengeance-rgb-16gb-ddr5-6000mhz-ram'),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 'skyland.com.bd', 'official', 37000, null::int, 'https://www.skyland.com.bd/corsair-vengeance-rgb-16gb-ddr5-6000mhz-cl36-ram'),
  ('corsair-vengeance-rgb-ddr5', '16GB 6000MHz', 'computervillage.com.bd', 'official', 37000, null::int, 'https://www.computervillage.com.bd/corsair-vengeance-rgb-16gb-ddr5-6000mhz-ram'),
  ('corsair-vengeance-rgb-ddr5', '32GB 6000MHz', 'pchouse.com.bd', 'official', 70000, 75900, 'https://www.pchouse.com.bd/corsair-vengeance-rgb-32gb-ddr5-6000mhz-ram'),
  ('corsair-vengeance-rgb-ddr5', '32GB 6000MHz', 'startech.com.bd', 'official', 94000, null::int, 'https://www.startech.com.bd/corsair-vengeance-rgb-32gb-ddr5-6000mhz-ram'),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 'onixbd.com', 'official', 30500, null::int, 'https://www.onixbd.com/gskill-flare-x5-16gb-ddr5-5600mhz-desktop-ram'),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 'pchouse.com.bd', 'official', 30500, 33500, 'https://www.pchouse.com.bd/g.skill-flare-x5-16gb-ddr5-5600mhz-ram'),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 'skyland.com.bd', 'official', 32500, null::int, 'https://www.skyland.com.bd/g-skill-flare-x5-16gb-ddr5-5600mhz-ram'),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 'startech.com.bd', 'official', 33000, null::int, 'https://www.startech.com.bd/g-skill-flare-x5-16gb-ddr5-5600mhz-ram'),
  ('g-skill-flare-x5-ddr5', '16GB 5600MHz', 'computervision.com.bd', 'official', 33500, null::int, 'https://computervision.com.bd/g-skill-flare-x5-16gb-ddr5-5600mhz-desktop-ram'),
  ('g-skill-ripjaws-ddr5-laptop', '16GB 4800MHz', 'computervillage.com.bd', 'official', 30505, null::int, 'https://www.computervillage.com.bd/gskill-ripjaws-16gb-ddr5-4800mhz-so-dimm-laptop-ram'),
  ('g-skill-ripjaws-ddr5-laptop', '16GB 4800MHz', 'startech.com.bd', 'official', 31500, null::int, 'https://www.startech.com.bd/g-skill-ripjaws-16gb-ddr5-4800mhz-laptop-ram'),
  ('g-skill-trident-z-rgb-ddr4', '16GB 3200MHz', 'skyland.com.bd', 'official', 16799, null::int, 'https://www.skyland.com.bd/g-skill-trident-z-rgb-16gb-ddr4-3200mhz-desktop-ram-trident-z-rgb'),
  ('g-skill-trident-z-rgb-ddr4', '16GB 3200MHz', 'startech.com.bd', 'official', 16800, null::int, 'https://www.startech.com.bd/g-skill-trident-z-16gb-rgb-desktop-ram'),
  ('g-skill-trident-z-rgb-ddr4', '16GB 3200MHz', 'computervision.com.bd', 'official', 16800, null::int, 'https://computervision.com.bd/gskill-trident-z-16gb-ddr4-3200mhz-rgb-desktop-ram'),
  ('g-skill-trident-z5-rgb-ddr5', '32GB 6000MHz', 'applegadgetsbd.com', 'unofficial', 61500, null::int, 'https://www.applegadgetsbd.com/product/gskill-trident-z5-32gb-ddr5-rgb-desktop-ram'),
  ('g-skill-trident-z5-rgb-ddr5', '32GB 6000MHz', 'computervillage.com.bd', 'official', 65000, null::int, 'https://www.computervillage.com.bd/g-skill-trident-z5-rgb-32gb-ddr5-6000mhz-ram'),
  ('g-skill-trident-z5-rgb-ddr5', '32GB 6000MHz', 'computervision.com.bd', 'official', 67800, null::int, 'https://computervision.com.bd/g-skill-trident-z5-rgb-32gb-ddr5-6000mhz-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'skyland.com.bd', 'unofficial', 7299, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram-unofficial'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'computervillage.com.bd', 'official', 7500, null::int, 'https://www.computervillage.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'startech.com.bd', 'official', 7999, null::int, 'https://www.startech.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'computervision.com.bd', 'official', 8300, null::int, 'https://computervision.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'onixbd.com', 'official', 8600, null::int, 'https://www.onixbd.com/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'pchouse.com.bd', 'official', 8600, 9300, 'https://www.pchouse.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '8GB 3200MHz', 'skyland.com.bd', 'official', 8700, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-8gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'skyland.com.bd', 'unofficial', 15499, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-16gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'startech.com.bd', 'official', 15999, null::int, 'https://www.startech.com.bd/kingston-fury-beast-16gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'skyland.com.bd', 'official', 16499, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-16gb-3200mhz-ddr4-cl16-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'computervision.com.bd', 'official', 16500, null::int, 'https://computervision.com.bd/kingston-fury-beast-16gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'onixbd.com', 'official', 16700, null::int, 'https://www.onixbd.com/kingston-fury-beast-16gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr4', '16GB 3200MHz', 'pchouse.com.bd', 'official', 17500, 20100, 'https://www.pchouse.com.bd/kingston-fury-beast-16gb-3200mhz-ddr4-desktop-ram'),
  ('kingston-fury-beast-ddr5', '8GB 5600MHz', 'skyland.com.bd', 'official', 19399, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-8gb-ddr5-5600mhz-ram'),
  ('kingston-fury-beast-ddr5', '8GB 5600MHz', 'computervision.com.bd', 'official', 20200, null::int, 'https://computervision.com.bd/kingston-fury-beast-8gb-ddr5-5600mhz-cl36-ram'),
  ('kingston-fury-beast-ddr5', '8GB 5600MHz', 'startech.com.bd', 'official', 20200, null::int, 'https://www.startech.com.bd/kingston-fury-beast-8gb-ddr5-5600mhz-cl36-ram'),
  ('kingston-fury-beast-ddr5', '8GB 5600MHz', 'pchouse.com.bd', 'official', 20600, 22350, 'https://www.pchouse.com.bd/kingston-fury-beast-8gb-ddr5-5600mhz-cl36-ram'),
  ('kingston-fury-beast-ddr5', '16GB 6000MHz', 'computervillage.com.bd', 'official', 30300, null::int, 'https://www.computervillage.com.bd/kingston-fury-beast-16gb-6000mhz-cl30-ddr5-ram'),
  ('kingston-fury-beast-ddr5', '16GB 6000MHz', 'skyland.com.bd', 'official', 35500, null::int, 'https://www.skyland.com.bd/kingston-fury-beast-kf560c30bbe-16-sp-ddr5-ram'),
  ('lexar-thor-ddr4', '8GB 3200MHz', 'startech.com.bd', 'official', 7999, null::int, 'https://www.startech.com.bd/lexar-thor-8gb-ddr4-3200mhz-ram'),
  ('lexar-thor-ddr4', '8GB 3200MHz', 'skyland.com.bd', 'official', 9800, null::int, 'https://www.skyland.com.bd/lexar-thor-8gb-ddr4-3200mhz-ram'),
  ('lexar-thor-ddr4', '8GB 3200MHz', 'globalbrand.com.bd', 'official', 11500, null::int, 'https://www.globalbrand.com.bd/lexar-thor-8-gb-ddr4-3200-bus-gaming-ram'),
  ('lexar-thor-ddr4', '8GB 3200MHz', 'pchouse.com.bd', 'official', 11500, 12500, 'https://www.pchouse.com.bd/lexar-thor-8gb-ddr4-3200mhz-udimm-desktop-ram'),
  ('lexar-thor-ddr4', '16GB 3200MHz', 'pchouse.com.bd', 'official', 16000, 17500, 'https://www.pchouse.com.bd/lexar-thor-16gb-3200mhz-ddr4-desktop-ram-price-in-bd'),
  ('lexar-thor-ddr4', '16GB 3200MHz', 'globalbrand.com.bd', 'official', 19000, null::int, 'https://www.globalbrand.com.bd/lexar-thor-16-gb-ddr4-3200-bus-gaming-ram'),
  ('netac-basic-ddr4-laptop', '8GB 3200MHz', 'startech.com.bd', 'official', 7600, null::int, 'https://www.startech.com.bd/netac-basic-so-ddr4-3200mhz-8gb-laptop-ram'),
  ('netac-basic-ddr4-laptop', '8GB 3200MHz', 'skyland.com.bd', 'official', 9500, null::int, 'https://www.skyland.com.bd/netac-basic-so-ddr4-3200mhz-8gb-laptop-ram'),
  ('netac-basic-ddr4-laptop', '16GB 3200MHz', 'skyland.com.bd', 'official', 12800, null::int, 'https://www.skyland.com.bd/netac-basic-so-ddr4-3200mhz-16gb-laptop-ram'),
  ('netac-basic-ddr4-laptop', '16GB 3200MHz', 'startech.com.bd', 'official', 13800, null::int, 'https://www.startech.com.bd/netac-basic-so-ddr4-3200mhz-16gb-laptop-ram'),
  ('teamgroup-t-force-delta-rgb-ddr5', '16GB 6000MHz', 'pchouse.com.bd', 'official', 31500, 36500, 'https://www.pchouse.com.bd/team-t-force-delta-rgb-16gb-6000mhz-ddr5-gaming-ram'),
  ('teamgroup-t-force-delta-rgb-ddr5', '16GB 6000MHz', 'onixbd.com', 'official', 33500, null::int, 'https://www.onixbd.com/team-t-force-delta-rgb-black-16gb-ddr5-6000mhz-cl38-desktop-ram'),
  ('teamgroup-t-force-delta-rgb-ddr5', '16GB 6000MHz', 'skyland.com.bd', 'official', 35500, null::int, 'https://www.skyland.com.bd/team-t-force-delta-rgb-white-16gb-6000mhz-ddr5-ram'),
  ('teamgroup-t-force-delta-rgb-ddr5', '32GB 6000MHz', 'skyland.com.bd', 'official', 71499, null::int, 'https://www.skyland.com.bd/team-t-force-delta-rgb-32gb-ddr5-ram'),
  ('teamgroup-t-force-delta-rgb-ddr5', '32GB 6000MHz', 'startech.com.bd', 'official', 96000, null::int, 'https://www.startech.com.bd/team-t-force-delta-rgb-32gb-ddr5-6000mhz-cl30-ram'),
  ('teamgroup-t-force-vulcan-z-ddr4', '8GB 3200MHz', 'skyland.com.bd', 'official', 7299, null::int, 'https://www.skyland.com.bd/team-t-force-vulcan-z-8gb-ddr4-3200mhz-cl16-ram'),
  ('teamgroup-t-force-vulcan-z-ddr4', '8GB 3200MHz', 'pchouse.com.bd', 'official', 7500, 7950, 'https://www.pchouse.com.bd/team-t-force-vulcan-z-red-8gb-ddr4-3200mhz-ram'),
  ('teamgroup-t-force-vulcan-z-ddr4', '8GB 3200MHz', 'startech.com.bd', 'official', 7800, null::int, 'https://www.startech.com.bd/team-t-force-vulcan-z-8gb-ddr4-3200mhz-cl16-ram'),
  ('teamgroup-t-force-vulcan-z-ddr4', '8GB 3200MHz', 'onixbd.com', 'official', 7811, null::int, 'https://www.onixbd.com/team-t-force-vulcan-z-red-8gb-ddr4-3200mhz-desktop-gaming-ram')
) as o(slug, label, host, condition, price, old_price, url)
join products p on p.slug = o.slug
join variants v on v.product_id = p.id and v.label = o.label
join lateral (select id from sellers where website ilike '%' || o.host || '%' order by created_at limit 1) s on true
where not exists (select 1 from offers where url = o.url)
on conflict (variant_id, seller_id, condition) do nothing;

commit;
