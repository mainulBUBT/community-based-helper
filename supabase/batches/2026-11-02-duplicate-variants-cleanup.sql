-- ২ নভেম্বর ২০২৬: ডুপ্লিকেট ভার্সনের পুরনো অফার মোছা আর ভুল ভার্সনে বসা অফার ঠিক করা।
-- এটা এককালীন ডেটা-ঠিক, ইতিমধ্যে লাইভ ডেটাবেসে চালানো হয়েছে (supabase db query --linked -f)। রেকর্ড হিসেবে রাখা।
-- প্রতিটা update/delete এ id + বর্তমান variant_id গার্ড আছে, তাই আবার চালালে কিছুই বদলায় না।
--
-- কেন: ajwa-dates, maryam-mabroom-dates, medjool-dates (1kg) আর karkuma-organic-honey (400g) এ একই লেবেলের দুটো করে ভার্সন ছিল
-- (import-catalog.mjs ক্রমিক ~v1, ~v2 id বানায়), তাই এক URL এ দুই অফার হয়ে prices job ভার্সন মেলাতে পারত না।
-- মোছা: ১৩ (একই দোকান, একই URL, কিপ-ভার্সনে আছে)। সরানো: ৫ (Haramain maryam, Chaldal/Haramain medjool, Holy Basket, MedEasy)।
-- নতুন 250g ভার্সন: Khaas এর পাতায় 250g=৳৫৫০ আর 500g=৳১০৫০; দাম ভুল ভার্সনে বসা ছিল।
-- ছোঁয়া হয়নি: Haramain ajwa এর দুটো 1kg (aliya আর super-premium আলাদা ধরা), niacinamide এর দুই পণ্য।

begin;

-- ১ নভেম্বর পরবর্তী: ডুপ্লিকেট ভার্সনের পুরনো অফার মোছা, ভুল ভার্সনে বসা অফার সরানো (২ নভেম্বর ২০২৬)

-- ক. ডুপ্লিকেট ভার্সনের পুরনো কপি (একই দোকান, একই URL, কিপ-ভার্সনে আছে): ১৩টা
delete from offers where id = '7651720a-8ff8-42bf-8b1c-bfd90fe27efe' and variant_id = '3ce149bd-1e52-4b58-d60e-85edccdfcb30' and url = 'https://www.rokomari.com/product/290845/deshanol-ajwa-premium-dates-ajwa-khejur-1-kg'; -- ajwa-dates Rokomari older dup
delete from offers where id = '23f28595-4d09-4f4d-ad51-03ad81ce2aa7' and variant_id = '3ce149bd-1e52-4b58-d60e-85edccdfcb30' and url = 'https://www.arogga.com/product/90834/premium-saudi-ajwa-dates-ajwa-khejur-1000g'; -- ajwa-dates Arogga older dup
delete from offers where id = 'ab053ac9-84e4-4112-bc46-52ee3a9bf1fa' and variant_id = '3ce149bd-1e52-4b58-d60e-85edccdfcb30' and url = 'https://chaldal.com/ajwa-premium-dates-1-kg'; -- ajwa-dates Chaldal older dup
delete from offers where id = 'cb90691c-768f-4eeb-8c70-b4b9e89bc556' and variant_id = '3ce149bd-1e52-4b58-d60e-85edccdfcb30' and url = 'https://othoba.com/authentic-al-madinah-ajwa-dates-regular-size-1-kg-ziplock-intact-pack-jk-shop-812176'; -- ajwa-dates Othoba older dup
delete from offers where id = '51607d0f-34a4-4806-ae4b-fe203224a270' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://www.rokomari.com/product/450499/saad-maryam-premium-al-madinah-dates-1kg'; -- maryam-mabroom-dates Rokomari older dup
delete from offers where id = '732e185f-ec7c-4ede-b526-cfa40795c55e' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://www.arogga.com/product/90765/premium-saudi-maryam-dates-maryam-khejur-1kg'; -- maryam-mabroom-dates Arogga older dup
delete from offers where id = '5e79c088-55a9-4a02-8820-619bd8778bd3' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://chaldal.com/mabroom-dates-premium-1-kg'; -- maryam-mabroom-dates Chaldal older dup
delete from offers where id = 'a9f3867a-6663-4343-b4a6-ef0d7a987369' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://othoba.com/premium-mabroommorium-dates-khejur-1kg-simli-mart-1042273'; -- maryam-mabroom-dates Othoba older dup
delete from offers where id = '650ded99-a603-46e6-8923-8ce14e21c024' and variant_id = '3c1b6c59-6cb2-f965-f010-e0e52a42de66' and url = 'https://www.rokomari.com/product/539385/haramain-store-medjool-large-egyptian-dates-1-kg'; -- medjool-dates Rokomari older dup
delete from offers where id = 'c12f3aa5-67fe-490f-a3e9-7737a26cabbc' and variant_id = '3c1b6c59-6cb2-f965-f010-e0e52a42de66' and url = 'https://www.arogga.com/product/90764/palm-hills-premium-medjool-khejur-dates-medjool-khejur-1kg'; -- medjool-dates Arogga older dup
delete from offers where id = '1ffa5089-5f92-471a-b708-7b53975f2e92' and variant_id = '3c1b6c59-6cb2-f965-f010-e0e52a42de66' and url = 'https://othoba.com/premium-medjool-dates-large-size-1kg-box-sahil-mart-715120'; -- medjool-dates Othoba older dup
delete from offers where id = 'd3325f9a-0f63-42f8-adf9-ad46447900cc' and variant_id = '70ff3cde-f862-92ec-abd5-00dd1c548bc6' and url = 'https://www.rokomari.com/product/270266/karkuma-organic-honey-organic-modhu-400-gm'; -- karkuma-organic-honey Rokomari older dup
delete from offers where id = 'a5d40bb7-ae59-4e60-8144-31d6a56b5866' and variant_id = '70ff3cde-f862-92ec-abd5-00dd1c548bc6' and url = 'https://www.arogga.com/product/40922/karkuma-organic-honey-400g'; -- karkuma-organic-honey Arogga older dup

-- খ. Holy Basket আর MedEasy: কিপ-ভার্সনের ভুল-পাতার অফার আগে সরানো (নইলে unique (variant, seller, condition) আটকায়)
update offers set variant_id = 'd2424b88-bbd4-dafa-3f39-74a9fc08c7a9', variant_key = null where id = '339f5e67-18f1-4952-8c0f-05db0432bd3f' and variant_id = 'd08ba22d-3795-0a57-233b-4fb4f6276198' and url = 'https://holybasketbd.com/product/mariyam-dates-500gm/'; -- Holy Basket maryam: 500gm পাতা → 500g
update offers set variant_id = '390f9093-df2e-4ae5-8420-86b3f42b0cd0', variant_key = null where id = '4243cc03-4711-4d89-a448-ce67570e5af8' and variant_id = '5f6d3ee9-dd0d-a04f-2e56-85bfcea11d43' and url = 'https://medeasy.health/vitamins-and-supplement/karkuma-organic-honey-300-gm-food'; -- MedEasy karkuma: 300gm পাতা → 300gm

-- গ. ড্রপ-ভার্সন থেকে কিপ-ভার্সনে (কোনো সংঘর্ষ নেই): Haramain maryam, Chaldal/Haramain medjool + Holy Basket 1kg + MedEasy 400g
update offers set variant_id = 'd08ba22d-3795-0a57-233b-4fb4f6276198' where id = '23ff76fe-886f-4490-aa15-d1b3e53fc3fc' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://haramainstore.com/products/mabroom-large-premium-dates'; -- maryam-mabroom-dates Haramain Store → keep
update offers set variant_id = '92304706-afc1-8f0a-1ce5-6a12f38eda32' where id = 'ad82347d-0456-46e8-8e5c-900c8c2930e8' and variant_id = '3c1b6c59-6cb2-f965-f010-e0e52a42de66' and url = 'https://chaldal.com/medjool-dates-premium-1-kg'; -- medjool-dates Chaldal → keep
update offers set variant_id = '92304706-afc1-8f0a-1ce5-6a12f38eda32' where id = '08ef579a-127a-4f11-a3da-dc28846f974d' and variant_id = '3c1b6c59-6cb2-f965-f010-e0e52a42de66' and url = 'https://haramainstore.com/products/medjool-large-premium-dates-egyptian'; -- medjool-dates Haramain Store → keep
update offers set variant_id = 'd08ba22d-3795-0a57-233b-4fb4f6276198' where id = 'ae60ce01-d954-4e0c-9e30-1ec96ad3287e' and variant_id = '6ed1346b-3980-7471-b741-e99e55845338' and url = 'https://holybasketbd.com/product/mariyam-dates-1kg/'; -- Holy Basket maryam: 1kg পাতা → 1kg (keep)
update offers set variant_id = '5f6d3ee9-dd0d-a04f-2e56-85bfcea11d43' where id = 'd1c8537e-36aa-48a5-95d2-263df530e330' and variant_id = '70ff3cde-f862-92ec-abd5-00dd1c548bc6' and url = 'https://medeasy.health/vitamins-and-supplement/karkuma-organic-honey-400-gm-food'; -- MedEasy karkuma: 400gm পাতা → 400g (keep)

-- নতুন 250g ভার্সন (Khaas-এর পাতায় 250g=৳৫৫০ আছে); অফিসিয়াল দাম অজানা তাই ফাঁকা
insert into variants (product_id, label, attributes, position)
select p.id, '250g', '{"capacity": "250g"}'::jsonb, 3
from products p
where p.slug in ('ajwa-dates', 'maryam-mabroom-dates')
  and not exists (select 1 from variants v where v.product_id = p.id and v.label = '250g');

-- ajwa-dates: Khaas ৳৫৫০ (500g-তে বসে ছিল) → 250g
update offers set variant_id = (select v.id from variants v join products p on p.id = v.product_id where p.slug = 'ajwa-dates' and v.label = '250g'), variant_key = '250g'
where id = '23c1c088-f852-4487-8769-53a9a69a49a1' and variant_id = 'f7f0977c-90c0-77ec-b2c4-4a313b7bbb57';
-- ajwa-dates: Khaas ৳১০৫০ (1kg-তে বসে ছিল, আসলে 500g) → 500g
update offers set variant_id = 'f7f0977c-90c0-77ec-b2c4-4a313b7bbb57', variant_key = null
where id = '5f1e55ca-0838-4382-be3c-f49c55040335' and variant_id = 'a6a91f77-b18c-1335-d2f5-74c05a30d24d';
-- ajwa-dates: Holy Basket ৳৮৫০ (ajwa-dates-500gm পাতা, 1kg-তে বসে ছিল) → 500g
update offers set variant_id = 'f7f0977c-90c0-77ec-b2c4-4a313b7bbb57', variant_key = null
where id = 'abf6221a-573b-4fb7-a980-2911304d4a12' and variant_id = 'a6a91f77-b18c-1335-d2f5-74c05a30d24d';

-- maryam-mabroom-dates: Khaas ৳৫৫০ → 250g, ৳১০৫০ → 500g
update offers set variant_id = (select v.id from variants v join products p on p.id = v.product_id where p.slug = 'maryam-mabroom-dates' and v.label = '250g'), variant_key = '250g'
where id = '0e4303a1-68f8-4977-be98-22fbc788d5f2' and variant_id = 'd2424b88-bbd4-dafa-3f39-74a9fc08c7a9';
update offers set variant_id = 'd2424b88-bbd4-dafa-3f39-74a9fc08c7a9', variant_key = null
where id = 'd070f1b0-cfbf-4c6c-9dc7-cb78efde9f63' and variant_id = 'd08ba22d-3795-0a57-233b-4fb4f6276198';

commit;
