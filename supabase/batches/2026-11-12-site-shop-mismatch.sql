-- ২০২৬-১১-১২: সাইট-দোকান ভার্সন যাচাইয়ের ভুল অফার সরানো (docs/site-shop-mismatch-2026-11-12.md)।
-- প্রতিটা পাতা খুলে পুরো payload (সব অপশন আর দাম) মিলিয়ে দেখা। এক লিংকে টগলের ঠিক ভার্সনগুলো থাকে; বাদ শুধু যেগুলোর ভার্সন পাতায় নেই।
-- review_queue-এ rejected শুধু সেই লিংকে, যেখানে মোছার পর এই দোকানের আর কোনো অফার থাকে না;
-- লিংকে অফার থেকে গেলে discover ওটাকে চেনা লিংক ধরে বাদ দেয়, আর rejected দিলে ওই পাতার নতুন ভার্সনও আর ধরা পড়ত না।
-- প্রতিটা বদলে id + url গার্ড আছে; আবার চালালে কিছুই বদলায় না।
begin;

-- ১. সাইজ বা পণ্য ভুল (পাতার শিরোনাম বা সাইজ অন্য)
-- Shajgoj | aci-pure-multifloral-honey 250g | ৳120 | পাতা 100gm, 250g নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'ACI Pure Multifloral Honey 100gm', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Pure Multifloral Honey 250g', 'reason', 'পাতা 100gm, 250g নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'afb43b3b-f96a-4208-a4e0-657391f91197' and o.url = 'https://shop.shajgoj.com/product/aci-pure-multifloral-honey-100gm';
delete from offers where id = 'afb43b3b-f96a-4208-a4e0-657391f91197' and url = 'https://shop.shajgoj.com/product/aci-pure-multifloral-honey-100gm';
-- eFamas | meril-baby-lotion 200ml | ৳200 | পাতা 100ml, 200ml নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Meril Baby Lotion 100ml - eFamas', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Baby Lotion 200ml', 'reason', 'পাতা 100ml, 200ml নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'd3a708e4-d196-4ecb-a647-c03bbbe7d54a' and o.url = 'https://www.efamas.com.bd/shop/baby-skin-care/meril/meril-baby-lotion-100ml/';
delete from offers where id = 'd3a708e4-d196-4ecb-a647-c03bbbe7d54a' and url = 'https://www.efamas.com.bd/shop/baby-skin-care/meril/meril-baby-lotion-100ml/';
-- eFamas | parachute-just-for-baby-face-cream 50g | ৳250 | পাতা Milky Glow Face Cream 100ml, অন্য পণ্য
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Parachute Just For Baby - Milky Glow Face Cream 100ml - eFamas', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Just for Baby Face Cream 50g', 'reason', 'পাতা Milky Glow Face Cream 100ml, অন্য পণ্য', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '5e1c2e49-7fb4-4579-90da-ad66f5fca1b3' and o.url = 'https://www.efamas.com.bd/shop/baby-skin-care/parachute/parachute-just-for-baby-milky-glow-face-cream-100ml/';
delete from offers where id = '5e1c2e49-7fb4-4579-90da-ad66f5fca1b3' and url = 'https://www.efamas.com.bd/shop/baby-skin-care/parachute/parachute-just-for-baby-milky-glow-face-cream-100ml/';
-- UK Direct BD | maybelline-lash-sensational-sky-high-mascara 7.2ml | ৳1490 | পাতা 6ml, 7.2ml নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Maybelline New York Lash Sensational Sky High Washable Mascara 6ml • UK DIRECT BD', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Lash Sensational Sky High Mascara 7.2ml', 'reason', 'পাতা 6ml, 7.2ml নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'e02295b0-b302-4d56-9e31-092fcb66fd1a' and o.url = 'https://ukdirectbd.com/product/maybelline-new-york-lash-sensational-sky-high-washable-mascara-6ml/';
delete from offers where id = 'e02295b0-b302-4d56-9e31-092fcb66fd1a' and url = 'https://ukdirectbd.com/product/maybelline-new-york-lash-sensational-sky-high-washable-mascara-6ml/';
-- Shajgoj | maybelline-lash-sensational-sky-high-mascara 7.2ml | ৳1399 | পাতা 6ml, 7.2ml নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Maybelline New York Lash Sensational Sky High Waterproof Mascara', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Lash Sensational Sky High Mascara 7.2ml', 'reason', 'পাতা 6ml, 7.2ml নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '662c5fe4-0f13-4f91-95db-b7fcdcf0ccfd' and o.url = 'https://shop.shajgoj.com/product/maybelline-new-york-lash-sensational-sky-high-waterproof-mascara-2';
delete from offers where id = '662c5fe4-0f13-4f91-95db-b7fcdcf0ccfd' and url = 'https://shop.shajgoj.com/product/maybelline-new-york-lash-sensational-sky-high-waterproof-mascara-2';
-- Holy Basket | ajwa-dates 1kg | ৳850 | পাতা 500gm, 1kg নয়
delete from offers where id = '5aa38aee-0307-4b31-a62d-f2dc2c3befc2' and url = 'https://holybasketbd.com/product/ajwa-dates-500gm/';
-- Khaas Food | ajwa-dates 1kg | ৳1050 | পাতায় শুধু 250g/500g; দাম 500g-এর
delete from offers where id = '67401c8f-0d43-4d98-ad46-534911153136' and url = 'https://www.khaasfood.com/product/ajwa-dates';
-- Khaas Food | maryam-mabroom-dates 1kg | ৳1050 | পাতায় শুধু 250g/500g; দাম 500g-এর
delete from offers where id = 'e30a4503-765e-499c-9d5f-1236eebc9e9a' and url = 'https://www.khaasfood.com/product/maryam-dates-saudi';
-- Shajgoj | sebamed-clear-face-cleansing-foam 50ml | ৳1350 | পাতা 150ml, 50ml নয়
delete from offers where id = '2963e46a-0e3e-4d39-8c3c-f32ebefd4bfe' and url = 'https://shop.shajgoj.com/product/sebamed-clear-face-antibacterial-cleansing-foam';
-- Beauty Booth | etude-dear-darling-water-tint 9g | ৳750 | পাতা 4.5ml টিন্ট, 9g নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Etude House Dear Darling Water Gel Tint #RD309 Vampire Red (4.5ml)', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Dear Darling Water Tint 9g', 'reason', 'পাতা 4.5ml টিন্ট, 9g নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'f860edac-bf5b-4699-a8e0-0e08d855e3c7' and o.url = 'https://beautybooth.com.bd/product/dear-darling-water-gel-tint-bk801';
delete from offers where id = 'f860edac-bf5b-4699-a8e0-0e08d855e3c7' and url = 'https://beautybooth.com.bd/product/dear-darling-water-gel-tint-bk801';
-- Sumash Tech | hp-probook-460-g11 Core Ultra 5 125U 8GB / 512GB | ৳99999 | পাতা 16GB RAM, 8GB নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'HP ProBook 460 G11 Core Ultra 5 16GB RAM 512GB SSD 16" Laptop', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'ProBook 460 G11 Core Ultra 5 125U 8GB / 512GB', 'reason', 'পাতা 16GB RAM, 8GB নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '022aeb94-9631-4ddc-9691-501a4129343a' and o.url = 'https://www.sumashtech.com/product/hp-probook-460-g11-core-ultra-5-16gb-ram-512gb-ssd-16-laptop';
delete from offers where id = '022aeb94-9631-4ddc-9691-501a4129343a' and url = 'https://www.sumashtech.com/product/hp-probook-460-g11-core-ultra-5-16gb-ram-512gb-ssd-16-laptop';
-- Perfecto | cerave-hydrating-cream-to-foam-cleanser 87ml | ৳1300 | পাতায় একটাই সাইজ, দাম 236ml-এর
delete from offers where id = '2eea1bb7-a703-4a96-ad32-e719572f6ce0' and url = 'https://perfectobd.com/product/cerave-hydrating-cream-to-foam-cleanser-for-normal-to-dry-skin';
-- Shajgoj | cetaphil-moisturizing-lotion 236ml | ৳3589 | পাতা 250ml, 236ml নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Cetaphil Moisturizing Lotion (Normal To Combination, Sensitive Skin)', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Moisturizing Lotion 236ml', 'reason', 'পাতা 250ml, 236ml নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '0559570f-c372-4aaa-9711-e6350f9c8e17' and o.url = 'https://shop.shajgoj.com/product/cetaphil-moisturizing-lotion-normal-to-combination-sensitive-skin-2';
delete from offers where id = '0559570f-c372-4aaa-9711-e6350f9c8e17' and url = 'https://shop.shajgoj.com/product/cetaphil-moisturizing-lotion-normal-to-combination-sensitive-skin-2';
-- Shajgoj | cetaphil-moisturizing-lotion 237ml | ৳3589 | পাতা 250ml, 237ml নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Cetaphil Moisturizing Lotion (Normal To Combination, Sensitive Skin)', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Moisturizing Lotion 237ml', 'reason', 'পাতা 250ml, 237ml নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '15483e92-efe4-4b35-b52a-7ab7822bc8d6' and o.url = 'https://shop.shajgoj.com/product/cetaphil-moisturizing-lotion-normal-to-combination-sensitive-skin-2';
delete from offers where id = '15483e92-efe4-4b35-b52a-7ab7822bc8d6' and url = 'https://shop.shajgoj.com/product/cetaphil-moisturizing-lotion-normal-to-combination-sensitive-skin-2';

-- ২. মডেল ভুল (CPU, প্রজন্ম, GPU বা অন্য মডেল)
-- Dazzle | lenovo-thinkpad-e14-gen-7 Core Ultra 7 255H 16GB / 512GB | ৳159990 | পাতা ThinkPad E14 Gen 6 Ultra 7 155H
delete from offers where id = 'f485bc44-2dd2-4147-96a6-d35dfdb24e9b' and url = 'https://dazzle.com.bd/product/lenovo-thinkpad-e14-gen-6-intel-core-ultra-7-155h-intel-arc-graphics-14-wuxga-display-laptop-price-in-bangladesh';
-- Dazzle | lenovo-thinkpad-e14-gen-7 Core Ultra 5 225U 16GB / 512GB | ৳159990 | পাতা ThinkPad E14 Gen 6 Ultra 7 155H
delete from offers where id = '8e803be4-2745-45c3-aced-e0868d9e6007' and url = 'https://dazzle.com.bd/product/lenovo-thinkpad-e14-gen-6-intel-core-ultra-7-155h-intel-arc-graphics-14-wuxga-display-laptop-price-in-bangladesh';
-- Dazzle | lenovo-thinkpad-e14-gen-7 Core Ultra 5 225H 16GB / 512GB | ৳159990 | পাতা ThinkPad E14 Gen 6 Ultra 7 155H
delete from offers where id = 'bb261b5d-8438-4e12-ae0a-02b4c26241fb' and url = 'https://dazzle.com.bd/product/lenovo-thinkpad-e14-gen-6-intel-core-ultra-7-155h-intel-arc-graphics-14-wuxga-display-laptop-price-in-bangladesh';
-- Dazzle | lenovo-ideapad-slim-3-15irh10 Core i7-13620H 16GB / 512GB | ৳89990 | পাতা i5-13420H, i7 নয়
delete from offers where id = '8adfb1ad-51d6-4eb2-a7c5-ec3248068f9a' and url = 'https://dazzle.com.bd/product/lenovo-ideapad-slim-3-15irh10-intel-core-i5-13420h-intel-integrated-uhd-graphics-153-laptop-price-in-bangladesh';
-- Apple Gadgets | lenovo-ideapad-slim-3-15irh10 Core i7-13620H 8GB / 512GB | ৳75999 | পাতা i5-13420H, i7 নয়
delete from offers where id = 'c3715167-9ed3-4ee3-9d30-ca31a6de6fb6' and url = 'https://www.applegadgetsbd.com/product/lenovo-ideapad-slim-3-15irh10-laptop';
-- Apple Gadgets | lenovo-ideapad-slim-3-15irh10 Core i7-13620H 16GB / 512GB | ৳89990 | পাতা i5-13420H, i7 নয়
delete from offers where id = 'f275155a-b266-49c0-93bc-904a5f25a8a2' and url = 'https://www.applegadgetsbd.com/product/lenovo-ideapad-slim-3-15irh10-laptop';
-- Apple Gadgets | hp-probook-440-g11 Core Ultra 7 155U 8GB / 512GB | ৳105000 | পাতা Core Ultra 5 125U, Ultra 7 নয়
delete from offers where id = '79ff51ef-18c5-4fe0-9e84-87cb63d3aefb' and url = 'https://www.applegadgetsbd.com/product/hp-probook-440-g11-intel-core-ultra-5-125u-laptop';
-- Sumash Tech | lenovo-loq-15irx10 Core i7-13650HX RTX 5050 16GB / 512GB | ৳150999 | পাতা i5 13th Gen, i7 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Lenovo LOQ 15IRX10 Core i5 13th Gen RTX 5050 15.6" 144Hz Gaming Laptop', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'LOQ 15IRX10 Core i7-13650HX RTX 5050 16GB / 512GB', 'reason', 'পাতা i5 13th Gen, i7 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'dda89919-8bd3-4740-9fbc-0cd1ecc18b12' and o.url = 'https://www.sumashtech.com/product/lenovo-loq-15irx10-core-i5-13th-gen-rtx-5050-156-144hz-gaming-laptop';
delete from offers where id = 'dda89919-8bd3-4740-9fbc-0cd1ecc18b12' and url = 'https://www.sumashtech.com/product/lenovo-loq-15irx10-core-i5-13th-gen-rtx-5050-156-144hz-gaming-laptop';
-- Sumash Tech | lenovo-loq-15irx10 Core i7-14700HX RTX 5050 16GB / 512GB | ৳150999 | পাতা i5 13th Gen, i7 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Lenovo LOQ 15IRX10 Core i5 13th Gen RTX 5050 15.6" 144Hz Gaming Laptop', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'LOQ 15IRX10 Core i7-14700HX RTX 5050 16GB / 512GB', 'reason', 'পাতা i5 13th Gen, i7 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '995109d9-8d21-467b-b163-453b8986761b' and o.url = 'https://www.sumashtech.com/product/lenovo-loq-15irx10-core-i5-13th-gen-rtx-5050-156-144hz-gaming-laptop';
delete from offers where id = '995109d9-8d21-467b-b163-453b8986761b' and url = 'https://www.sumashtech.com/product/lenovo-loq-15irx10-core-i5-13th-gen-rtx-5050-156-144hz-gaming-laptop';
-- MacZen BD | apple-imac-24-m4 M4 10C GPU 16GB / 256GB | ৳233999 | পাতায় 10C GPU শুধু 16GB/512GB-এ
delete from offers where id = '74579905-89a8-4f4e-b8f9-70a0e0a1892a' and url = 'https://www.maczenbd.com/products/imac/imac-24-inch-m4';
-- HNS Tech | apple-imac-24-m4 M4 10C GPU 16GB / 256GB | ৳215000 | পাতা বেস iMac (8C GPU) 16/256
delete from offers where id = '7c839145-7422-4709-bda4-a1b4acf482f7' and url = 'https://www.hnstechbd.com/product-details/imac-m4/89';
-- Mobile Buzz BD | apple-imac-24-m4 M4 10C GPU 16GB / 256GB | ৳216999 | লিংক 8-core iMac-এর
delete from offers where id = 'f567bc63-47ed-4e0a-a661-446a5f410eb6' and url = 'https://mobilebuzzbd.com/product/imac-24-inch-m4-chip-8-core-cpu/';
-- Dazzle | apple-imac-24-m4 M4 10C GPU 24GB / 512GB | ৳249990 | পাতা 8-core iMac, 24GB অপশন নেই
delete from offers where id = '15cc4760-b0cf-4b4d-a72b-5910c04d2ed9' and url = 'https://dazzle.com.bd/product/apple-imac-24-inch-2024-m4-chip-8-core-cpu-8-core-gpu-price-in-bangladesh';
-- Dazzle | apple-imac-24-m4 M4 10C GPU 16GB / 512GB | ৳249990 | পাতা 8-core iMac, 10C GPU নেই
delete from offers where id = '5e9e908d-5c2b-45ea-a528-56e4976cdc52' and url = 'https://dazzle.com.bd/product/apple-imac-24-inch-2024-m4-chip-8-core-cpu-8-core-gpu-price-in-bangladesh';
-- Dazzle | oppo-reno15 8GB / 256GB | ৳65990 | পাতা Reno15 FS, Reno15 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'oppo-reno15-fs-price-in-bangladesh', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Reno15 8GB / 256GB', 'reason', 'পাতা Reno15 FS, Reno15 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'a12b6d92-30a8-4e72-9c66-e11edbd160a2' and o.url = 'https://dazzle.com.bd/product/oppo-reno15-fs-price-in-bangladesh';
delete from offers where id = 'a12b6d92-30a8-4e72-9c66-e11edbd160a2' and url = 'https://dazzle.com.bd/product/oppo-reno15-fs-price-in-bangladesh';
-- Kry International | oppo-reno15 8GB / 256GB | ৳59999 | পাতা Reno15 F (একই লিংকে Reno15 F-এ অফার আছে)
delete from offers where id = '885295a7-643a-4650-b818-04be49eb4969' and url = 'https://kryinternational.com/products/oppo-reno15-f-official';
-- Arafa Telecom | oneplus-nord-5 8GB / 256GB | ৳36999 | পাতা Nord CE5 (একই লিংকে CE5-এ অফার আছে)
delete from offers where id = 'f4bb801c-c668-4480-91cc-6be29690f753' and url = 'https://arafatelecom.com/product/oneplus-nord-ce5-indian/';
-- Dazzle | oneplus-nord-4 8GB / 128GB | ৳30990 | পাতা Nord CE4, Nord 4 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'oneplus-nord-ce4', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Nord 4 8GB / 128GB', 'reason', 'পাতা Nord CE4, Nord 4 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '741d0a37-ad9e-4d1d-9655-e9892a436270' and o.url = 'https://dazzle.com.bd/product/oneplus-nord-ce4';
delete from offers where id = '741d0a37-ad9e-4d1d-9655-e9892a436270' and url = 'https://dazzle.com.bd/product/oneplus-nord-ce4';
-- Arafa Telecom | oneplus-nord-4 8GB / 128GB | ৳29800 | পাতা Nord CE4, Nord 4 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'oneplus-nord-ce4', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Nord 4 8GB / 128GB', 'reason', 'পাতা Nord CE4, Nord 4 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '4f784e88-a2e8-4f31-b692-994318b31c74' and o.url = 'https://arafatelecom.com/product/oneplus-nord-ce4/';
delete from offers where id = '4f784e88-a2e8-4f31-b692-994318b31c74' and url = 'https://arafatelecom.com/product/oneplus-nord-ce4/';
-- Sumash Tech | oneplus-nord-4 8GB / 128GB | ৳33999 | পাতা Nord CE4, Nord 4 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'oneplus-nord-ce4', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Nord 4 8GB / 128GB', 'reason', 'পাতা Nord CE4, Nord 4 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '3154ae03-43d7-48b2-9811-d767494a9a81' and o.url = 'https://www.sumashtech.com/product/oneplus-nord-ce4';
delete from offers where id = '3154ae03-43d7-48b2-9811-d767494a9a81' and url = 'https://www.sumashtech.com/product/oneplus-nord-ce4';
-- Mobile Buzz BD | xiaomi-redmi-17 6GB / 128GB | ৳26500 | পাতা Redmi Note 17, Redmi 17 নয়
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'xiaomi-redmi-note-17', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Redmi 17 6GB / 128GB', 'reason', 'পাতা Redmi Note 17, Redmi 17 নয়', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '2f39ef7e-c058-4105-9e90-b6ff01b307c2' and o.url = 'https://mobilebuzzbd.com/product/xiaomi-redmi-note-17/';
delete from offers where id = '2f39ef7e-c058-4105-9e90-b6ff01b307c2' and url = 'https://mobilebuzzbd.com/product/xiaomi-redmi-note-17/';
-- Skyland | hp-probook-460-g11 Core Ultra 7 155U 16GB / 512GB | ৳110999 | পাতা Ultra 5 125U 16GB, দাম To be announced
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'hp-probook-460-g11-core-ultra-5-125u-16gb-ram-512gb-ssd-16-wuxga-laptop', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'ProBook 460 G11 Core Ultra 7 155U 16GB / 512GB', 'reason', 'পাতা Ultra 5 125U 16GB, দাম To be announced', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'aa204788-2be3-4e91-aadf-587bfbc38b1c' and o.url = 'https://www.skyland.com.bd/hp-probook-460-g11-core-ultra-5-125u-16gb-ram-512gb-ssd-16-wuxga-laptop';
delete from offers where id = 'aa204788-2be3-4e91-aadf-587bfbc38b1c' and url = 'https://www.skyland.com.bd/hp-probook-460-g11-core-ultra-5-125u-16gb-ram-512gb-ssd-16-wuxga-laptop';

-- ৩. Wi-Fi/Cellular বা GPS/Cellular: পাতায় এই কানেক্টিভিটির অপশন বা দাম নেই
-- Arafa Telecom | apple-ipad-11-inch-a16 256GB Wi-Fi + Cellular | ৳54000 | পাতায় Cellular অপশন নেই
delete from offers where id = '7145bf0b-5fd4-472a-948b-9c42092a3508' and url = 'https://arafatelecom.com/product/apple-ipad-11th-gen-2025/';
-- Arafa Telecom | honor-pad-x9-11-5-inch 4GB / 128GB Wi-Fi + Cellular | ৳22490 | পাতায় লেখা no cellular connectivity
delete from offers where id = 'd6859d54-8b67-4dee-be74-84fb206686b6' and url = 'https://arafatelecom.com/product/honor-pad-x9/';
-- Arafa Telecom | xiaomi-redmi-pad-2-9-7-inch 4GB / 128GB Wi-Fi + Cellular | ৳20500 | পাতায় Cellular অপশন নেই
delete from offers where id = 'a511cf33-7204-4512-89b0-c2479f1201c0' and url = 'https://arafatelecom.com/product/xiaomi-redmi-pad-2-unofficial/';
-- Arafa Telecom | xiaomi-redmi-pad-pro-12-1-inch 8GB / 256GB Wi-Fi + Cellular | ৳29400 | পাতায় Cellular অপশন নেই
delete from offers where id = '895ce781-8c18-41c0-8c3d-42d87e0fb07a' and url = 'https://arafatelecom.com/product/xiaomi-redmi-pad-pro/';
-- Arafa Telecom | samsung-galaxy-tab-s10-ultra 12GB / 256GB Wi-Fi | ৳139000 | লিংক Wi-Fi+SIM মডেলের
delete from offers where id = '003099bd-056e-4ec9-8f12-5c81ba1fc028' and url = 'https://arafatelecom.com/product/samsung-galaxy-tab-s10-ultra-12-256gb-wifisim/';
-- Arafa Telecom | samsung-galaxy-tab-s10-ultra 12GB / 512GB Wi-Fi | ৳152000 | লিংক Wi-Fi+SIM মডেলের
delete from offers where id = '219ed758-c66d-4b5d-a8e4-d29165046ad8' and url = 'https://arafatelecom.com/product/samsung-galaxy-tab-s10-ultra-12-512gb-wifisim/';
-- Dazzle | oneplus-pad-lite-11-inch 6GB / 128GB Wi-Fi + Cellular | ৳31990 | পাতায় Cellular অপশন নেই
delete from offers where id = '1c645782-7d62-4698-b9a2-a4b548573453' and url = 'https://dazzle.com.bd/product/oneplus-pad-lite';
-- Dazzle | samsung-galaxy-tab-s10-plus 12GB / 256GB Wi-Fi + Cellular | ৳183890 | পাতায় Cellular অপশন নেই
delete from offers where id = 'a2d72ec5-9576-48df-8523-55e7c0b62166' and url = 'https://dazzle.com.bd/product/samsung-galaxy-tab-s10-plus-official';
-- Dazzle | xiaomi-redmi-pad-pro-12-1-inch 8GB / 256GB Wi-Fi + Cellular | ৳31500 | পাতায় Cellular অপশন নেই
delete from offers where id = 'c0ff5657-06d6-42d6-b93e-e03de8ce82c8' and url = 'https://dazzle.com.bd/product/xiaomi-redmi-pad-pro';
-- Dazzle | xiaomi-redmi-pad-se-8-7-inch 4GB / 64GB Wi-Fi + Cellular | ৳14390 | পাতায় Cellular অপশন নেই
delete from offers where id = 'a72a6b81-c54f-4aca-958a-7ee2813edf10' and url = 'https://dazzle.com.bd/product/xiaomi-redmi-pad-se';
-- Diamu | oneplus-pad-go-2-12-1-inch 8GB / 256GB Wi-Fi + Cellular | ৳43500 | পাতায় Cellular অপশন নেই
delete from offers where id = 'c524a13b-841b-46ed-9e1c-ab3f0103e451' and url = 'https://diamu.com.bd/product/oneplus-pad-go-2/';
-- Apple Gadgets | oneplus-pad-go-2-12-1-inch 8GB / 256GB Wi-Fi + Cellular | ৳43499 | পাতায় Cellular অপশন নেই
delete from offers where id = '99395cc3-bf3e-4ec7-a312-6642d7fa7871' and url = 'https://www.applegadgetsbd.com/product/oneplus-pad-go-2';
-- Mobile Buzz BD | honor-pad-x9-11-5-inch 4GB / 128GB Wi-Fi + Cellular | ৳24500 | LTE-র আলাদা লিংকে অফার আছে
delete from offers where id = '7806e055-bd56-4672-b161-a51c19d78723' and url = 'https://mobilebuzzbd.com/product/honor-pad-x9-official/';
-- Star Tech | apple-ipad-mini-a17-pro 128GB Wi-Fi + Cellular | ৳73500 | পাতায় Cellular অপশন নেই
delete from offers where id = 'f7ffa86e-92d0-4d0f-907a-679269945920' and url = 'https://www.startech.com.bd/apple-ipad-mini-7';
-- Star Tech | apple-ipad-pro-11-inch-m5 256GB Wi-Fi | ৳168500 | লিংক Cellular মডেলের
delete from offers where id = '43a3d436-39e7-4927-91f6-a57bd8be2610' and url = 'https://www.startech.com.bd/ipad-pro-m5-cellular';
-- Star Tech | apple-ipad-pro-13-inch-m5 512GB Wi-Fi + Cellular | ৳207000 | পাতা Wi-Fi মডেলের
delete from offers where id = '149ac6af-e901-45f2-8d7b-77d1ac41356c' and url = 'https://www.startech.com.bd/ipad-pro-m5-13-inch';
-- Star Tech | apple-ipad-pro-13-inch-m5 256GB Wi-Fi + Cellular | ৳172000 | পাতা Wi-Fi মডেলের
delete from offers where id = 'ca781d3e-a5e2-4bcf-957d-061f1814cee5' and url = 'https://www.startech.com.bd/ipad-pro-m5-13-inch';
-- HNS Tech | apple-watch-series-11 42mm GPS + Cellular | ৳45000 | পাতায় Cellular অপশন নেই
delete from offers where id = 'baa77721-c59e-4bc6-8947-4f4a5ddae9f9' and url = 'https://www.hnstechbd.com/product-details/apple-watch-series-11/92';
-- Gadget Breeze | apple-watch-series-11 42mm GPS + Cellular | ৳42500 | পাতায় Cellular অপশন নেই
delete from offers where id = '7b8a4f5f-c3fa-43d1-928f-71626677a740' and url = 'https://gadgetbreeze.com.bd/product/apple-watch-series-11/';
-- Gadget Breeze | samsung-galaxy-tab-a11 8GB / 128GB Wi-Fi + Cellular | ৳19300 | পাতার Cellular দাম 4/64-এর
delete from offers where id = 'a12a0186-3b96-4eda-ab5d-67576aa70a53' and url = 'https://gadgetbreeze.com.bd/product/samsung-galaxy-tab-a11/';
-- MacZen BD | apple-ipad-11-inch-a16 256GB Wi-Fi + Cellular | ৳70000 | পাতায় এই ভার্সন Call for price
delete from offers where id = '024160ef-8a20-410a-adc1-e97ffc72e525' and url = 'https://www.maczenbd.com/products/ipad/ipad-11-gen-a16';
-- MacZen BD | apple-ipad-air-11-inch-m4 128GB Wi-Fi + Cellular | ৳88990 | পাতায় এই ভার্সনের দাম নেই
delete from offers where id = 'a54f0a30-12ee-494a-ab4a-0f636a15381d' and url = 'https://www.maczenbd.com/products/ipad/ipad-air-m4';
-- MacZen BD | apple-ipad-air-11-inch-m4 256GB Wi-Fi + Cellular | ৳107000 | পাতায় এই ভার্সনের দাম নেই
delete from offers where id = 'c43765cb-b305-4cf5-b4ff-9912c5dfbd01' and url = 'https://www.maczenbd.com/products/ipad/ipad-air-m4';
-- MacZen BD | apple-ipad-air-13-inch-m4 128GB Wi-Fi + Cellular | ৳112000 | পাতায় এই ভার্সনের দাম নেই
delete from offers where id = '70802601-8deb-4981-a02e-4c9e8428d1b3' and url = 'https://www.maczenbd.com/products/ipad/ipad-air-m4';
-- MacZen BD | apple-ipad-mini-a17-pro 128GB Wi-Fi + Cellular | ৳72990 | পাতায় এই ভার্সনের দাম নেই
delete from offers where id = '88ff0271-c4ca-4e46-9419-eddfe831f59c' and url = 'https://www.maczenbd.com/products/ipad/ipad-mini-7';
-- MacZen BD | apple-ipad-pro-11-inch-m5 256GB Wi-Fi + Cellular | ৳141990 | পাতায় 11 ইঞ্চি Cellular নেই
delete from offers where id = '20cf72b4-5c09-4302-b6df-9fdef4e20534' and url = 'https://www.maczenbd.com/products/ipad/ipad-pro-m5-2025';

-- ৪. পাতায় আর নেই এমন ভার্সন (দাম অন্য ভার্সনের)
-- Apple Gadgets | apple-iphone-duo 256GB | ৳329999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '8cf2354f-facf-42f6-9115-8334711a788e' and url = 'https://www.applegadgetsbd.com/product/iphone-duo';
-- Apple Gadgets | apple-iphone-duo 1TB | ৳429999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '4f31fb66-3c1d-41cf-a0ce-058366dce270' and url = 'https://www.applegadgetsbd.com/product/iphone-duo';
-- Apple Gadgets | apple-iphone-duo 2TB | ৳519999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'e79796d2-a2f7-429b-b305-d85e45b751f1' and url = 'https://www.applegadgetsbd.com/product/iphone-duo';
-- Diamu | apple-iphone-duo 256GB | ৳429999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'a0011f08-9ca2-422e-8f83-8734df08ca55' and url = 'https://diamu.com.bd/product/iphone-duo/';
-- Diamu | apple-iphone-duo 1TB | ৳429999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '8c7f03ec-3b67-4dbe-9ede-415934075b88' and url = 'https://diamu.com.bd/product/iphone-duo/';
-- Diamu | apple-iphone-duo 2TB | ৳519999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'a340ed66-7cc6-4466-a3ce-653d325809c2' and url = 'https://diamu.com.bd/product/iphone-duo/';
-- Apple Gadgets | honor-magic8-pro 12GB / 256GB | ৳115999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '093ed16c-fe4a-42a3-a3ce-4a80a808aa4b' and url = 'https://www.applegadgetsbd.com/product/honor-magic8-pro';
-- Apple Gadgets | oneplus-15r 12GB / 512GB | ৳73500 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '6c8221a1-55f9-4cdf-b58a-95cf112babe8' and url = 'https://www.applegadgetsbd.com/product/oneplus-15r';
-- Apple Gadgets | samsung-galaxy-a17-5g 8GB / 256GB | ৳38999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '981ddb9a-3e7e-4160-9c7c-d9758d474d41' and url = 'https://www.applegadgetsbd.com/product/galaxy-a17-5g-official';
-- Apple Gadgets | samsung-galaxy-a36-5g 6GB / 128GB | ৳33999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '26ff2a4e-afda-49b3-8974-99a42c54021d' and url = 'https://www.applegadgetsbd.com/product/galaxy-a36-5g';
-- Apple Gadgets | samsung-galaxy-a56-5g 8GB / 128GB | ৳42000 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'fe0dbc8b-e5c3-4fe9-9e23-1e46157ca09b' and url = 'https://www.applegadgetsbd.com/product/galaxy-a56-5g';
-- Kry International | motorola-edge-70-fusion 8GB / 128GB | ৳38499 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '749483af-e21f-4715-a2e8-22ee78ae556a' and url = 'https://kryinternational.com/products/motorola-edge-70-fusion';
-- Kry International | motorola-signature 16GB / 512GB | ৳81999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'db5acf11-cbc8-4461-ab63-9c47f1cda0a2' and url = 'https://kryinternational.com/products/motorola-signature';
-- Kry International | nothing-phone-3a 8GB / 128GB | ৳42999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Nothing Phone 3a', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Phone 3a 8GB / 128GB', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '055ef01b-db24-40fa-b58b-57984301c46f' and o.url = 'https://kryinternational.com/products/nothing-phone-3a';
delete from offers where id = '055ef01b-db24-40fa-b58b-57984301c46f' and url = 'https://kryinternational.com/products/nothing-phone-3a';
-- Kry International | nothing-phone-3a 8GB / 256GB | ৳43999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Nothing Phone 3a', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Phone 3a 8GB / 256GB', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '9f036745-5588-4dad-a523-44cba20edf88' and o.url = 'https://kryinternational.com/products/nothing-phone-3a';
delete from offers where id = '9f036745-5588-4dad-a523-44cba20edf88' and url = 'https://kryinternational.com/products/nothing-phone-3a';
-- Kry International | nothing-phone-3a-lite 8GB / 256GB | ৳40499 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Nothing Phone 3a Lite', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Phone 3a Lite 8GB / 256GB', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '555d5f43-ec28-4290-89d0-5eed699626c3' and o.url = 'https://kryinternational.com/products/nothing-phone-3a-lite';
delete from offers where id = '555d5f43-ec28-4290-89d0-5eed699626c3' and url = 'https://kryinternational.com/products/nothing-phone-3a-lite';
-- Kry International | oppo-reno15-pro 512GB | ৳70999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'e0ee827f-1bd6-4d78-9458-432816a9e39a' and url = 'https://kryinternational.com/products/oppo-reno15-pro';
-- Kry International | samsung-galaxy-a56-5g 8GB / 256GB | ৳49999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '69d9ecea-9576-4dad-89c6-5753a6c98823' and url = 'https://kryinternational.com/products/samsung-galaxy-a56';
-- Kry International | xiaomi-redmi-15c 8GB / 256GB | ৳22499 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '499f183c-b04d-4ce3-a5a1-b81292786a4a' and url = 'https://kryinternational.com/products/redmi-15c';
-- Rio International | samsung-galaxy-m16-5g 8GB / 128GB | ৳20999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Samsung Galaxy M16 5G Price In Bangladesh', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Galaxy M16 5G 8GB / 128GB', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = 'eb7aba5a-b222-44b7-b7ca-97c8cc90829d' and o.url = 'https://riointernational.com.bd/product/samsung-galaxy-m16-5g';
delete from offers where id = 'eb7aba5a-b222-44b7-b7ca-97c8cc90829d' and url = 'https://riointernational.com.bd/product/samsung-galaxy-m16-5g';
-- Rio International | samsung-galaxy-s25-plus 12GB / 512GB | ৳91999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Samsung Galaxy S25+ Price in Bangladesh | Rio International', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Galaxy S25 Plus 12GB / 512GB', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '6faa990c-bc9b-4ec5-9bb5-fec5b56be9aa' and o.url = 'https://riointernational.com.bd/product/samsung-galaxy-s25-plus';
delete from offers where id = '6faa990c-bc9b-4ec5-9bb5-fec5b56be9aa' and url = 'https://riointernational.com.bd/product/samsung-galaxy-s25-plus';
-- Rio International | samsung-galaxy-tab-s10-plus 12GB / 512GB Wi-Fi | ৳79999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Samsung Galaxy Tab S10+ Price in Bangladesh', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Galaxy Tab S10 Plus 12GB / 512GB Wi-Fi', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '9fca73c0-cb2e-4727-8b4b-f1444c113330' and o.url = 'https://riointernational.com.bd/product/samsung-galaxy-tab-s10+';
delete from offers where id = '9fca73c0-cb2e-4727-8b4b-f1444c113330' and url = 'https://riointernational.com.bd/product/samsung-galaxy-tab-s10+';
-- Rio International | xiaomi-pad-7-pro-11-2-inch 8GB / 256GB Wi-Fi | ৳54999 | পাতার অপশনে এই ভার্সন নেই
insert into review_queue (kind, status, payload, resolved_at, applied_at)
select 'match', 'rejected',
  jsonb_build_object('listing', 'Xiaomi Pad 7 Pro Price in Bangladesh | Rio International', 'seller', s.name, 'price', o.price::text, 'url', o.url,
    'guess', 'Pad 7 Pro 11.2-inch 8GB / 256GB Wi-Fi', 'reason', 'পাতার অপশনে এই ভার্সন নেই', 'sellerId', o.seller_id, 'variantId', o.variant_id, 'condition', o.condition),
  now(), now()
from offers o join sellers s on s.id = o.seller_id
where o.id = '99d30f90-18f2-4d27-a5c0-a14bb023d36e' and o.url = 'https://riointernational.com.bd/product/xiaomi-pad-7-pro';
delete from offers where id = '99d30f90-18f2-4d27-a5c0-a14bb023d36e' and url = 'https://riointernational.com.bd/product/xiaomi-pad-7-pro';
-- Sumash Tech | samsung-galaxy-a17-5g 8GB / 256GB | ৳39999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '0367a463-6c68-409a-8131-40a2bb4a4a43' and url = 'https://www.sumashtech.com/product/galaxy-a17-5g-official';
-- Sumash Tech | samsung-galaxy-tab-s10-fe 12GB / 256GB Wi-Fi | ৳57499 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'ef90a6df-cc14-452f-996d-7c7b9badaa58' and url = 'https://www.sumashtech.com/product/galaxy-tab-s10-fe';
-- Sumash Tech | tecno-spark-go-3 4GB / 128GB | ৳16499 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '2f0cf54f-e2c8-414c-903c-be4099d0ef62' and url = 'https://www.sumashtech.com/product/tecno-spark-go-3-official';
-- Star Tech | tecno-spark-50c 4GB / 128GB | ৳21999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'eb35ebca-b54c-42bf-828f-a2cff5f0423b' and url = 'https://www.startech.com.bd/tecno-spark-50c';
-- Star Tech | apple-watch-series-11 42mm GPS | ৳41300 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '8f57e795-c4b4-451c-b71a-ed6699557812' and url = 'https://www.startech.com.bd/apple-watch-series-11';
-- Star Tech | apple-watch-series-11 42mm GPS | ৳41300 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '5881193d-2d4c-4a14-ad72-4fe8300869f0' and url = 'https://www.startech.com.bd/apple-watch-series-11';
-- Star Tech | apple-watch-series-11 42mm GPS + Cellular | ৳41300 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = '3779a6ca-b34c-430d-b1da-a549ac228736' and url = 'https://www.startech.com.bd/apple-watch-series-11';
-- Dazzle | honor-600-pro 12GB / 512GB | ৳99999 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'f6ed88c7-36a9-4674-886d-94dd436edad6' and url = 'https://dazzle.com.bd/product/honor-600-pro-official-price-in-bangladesh';
-- Dazzle | lenovo-ideapad-slim-3-14irh10 Core i5-13420H 16GB / 1TB | ৳72990 | পাতার অপশনে এই ভার্সন নেই
delete from offers where id = 'cba9486f-ae94-4bc3-8fe7-2e7efe0eb0c0' and url = 'https://dazzle.com.bd/product/lenovo-ideapad-slim-3-14irh10-intel-core-i5-13420h-intel-integrated-uhd-graphics-14-display-laptop-price-in-bangladesh';

-- ৫. Reno15 F-এর পাতা ভুল করে Oppo Reno15-এ: সঠিক পণ্যে সরানো (এই দোকানের ওখানে অফার নেই)
update offers set variant_id = '532764cd-ce4e-d231-5595-7ad671577397', variant_key = null where id = 'f087de0d-85d8-490b-99df-7f9905326517' and url = 'https://mobilebuzzbd.com/product/oppo-reno15-f/'
  and not exists (select 1 from offers d where d.variant_id = '532764cd-ce4e-d231-5595-7ad671577397' and d.seller_id = offers.seller_id and d.condition = offers.condition);
update offers set variant_id = '532764cd-ce4e-d231-5595-7ad671577397', variant_key = null where id = '3cbe6594-c09a-4b1d-8bbe-2b7e8e1af1ee' and url = 'https://dazzle.com.bd/product/oppo-reno-15-f-official-price-in-bangladesh'
  and not exists (select 1 from offers d where d.variant_id = '532764cd-ce4e-d231-5595-7ad671577397' and d.seller_id = offers.seller_id and d.condition = offers.condition);

-- ৬. Arafa Redmi Pad 2 Pro Cellular: পাতায় 5G অপশন ৳৪৪,৯৯৯; matcher 5g-কে Cellular ধরে না বলে 4G-র দামে বসেছিল
update offers set price = 44999, variant_key = '256gb 5g 8gb official' where id = 'f282e216-899d-41da-8764-f8aef213a025' and url = 'https://arafatelecom.com/product/xiaomi-redmi-pad-2-pro/';

-- ৭. দ্বৈত অফার: একই লিংক, একই ভার্সন, official আর unofficial দুটোই। দোকানের নিজের condition-এর অফারটা থাকে
-- Apple Gadgets | amazfit-active-2-premium Round | রাখা unofficial
delete from offers where id = 'f3f1b97f-4900-4217-b8af-e1b6bfadb401' and url = 'https://www.applegadgetsbd.com/product/amazfit-active-2-smart-watch-premium-version' and exists (select 1 from offers k where k.id = '46ad3ffa-d3f2-4491-9f65-f31ee69ff0aa');
-- Apple Gadgets | amazfit-active-2-premium Square | রাখা unofficial
delete from offers where id = '7f1cbf14-8b80-462c-8345-314bf83b8902' and url = 'https://www.applegadgetsbd.com/product/amazfit-active-2-smart-watch-premium-version' and exists (select 1 from offers k where k.id = 'a8813bfa-600a-4d48-a769-b3df8ddc753c');
-- Diamu | huawei-watch-fit-4 1.82" Bluetooth | রাখা unofficial
delete from offers where id = '8a3318c0-e03f-4a9e-9aa7-5ebf68040f11' and url = 'https://diamu.com.bd/product/huawei-watch-fit-4/' and exists (select 1 from offers k where k.id = '97bad9e6-35a1-43ed-9e22-0788ae5693b6');
-- MC Solution | apple-macbook-air-15-m3 M3 16GB / 512GB | রাখা official
delete from offers where id = '8a37fa0c-6d81-49c4-bd38-53e75462b3ed' and url = 'https://mcsolution.com.bd/macbook-air-15-m3-16-512/' and exists (select 1 from offers k where k.id = '5f4909ac-6c7e-4fdf-ad11-ccf13706ab2b');
-- MC Solution | apple-macbook-air-15-m3 M3 8GB / 512GB | রাখা official
delete from offers where id = 'd694bcdf-4109-4571-a0be-97fc58340b43' and url = 'https://mcsolution.com.bd/macbook-air-15-m3-8-512/' and exists (select 1 from offers k where k.id = '85251a59-28af-419a-a5ef-cbdc302d15c5');
-- Othoba | american-gourmet-honey 500g | রাখা official
delete from offers where id = '6af4e109-880e-4ae2-99ec-d8cede5ed67a' and url = 'https://othoba.com/international-australian-product-american-gurmet-honey-500-gm-sr-international-605569' and exists (select 1 from offers k where k.id = '9e7a7f8a-e6c5-45d5-a725-ad3b928931bc');
-- Star Tech | apple-ipad-11-inch-a16 128GB Wi-Fi | রাখা official
delete from offers where id = '9ab65671-c7df-4949-854e-6b586397504a' and url = 'https://www.startech.com.bd/apple-ipad-11-inch-11th-gen' and exists (select 1 from offers k where k.id = '4eaca9bf-816e-4830-966d-d73a7588a286');
-- Star Tech | apple-ipad-11-inch-a16 128GB Wi-Fi + Cellular | রাখা official
delete from offers where id = '05ea4d8a-34f2-4d56-b30d-5cab3c8e1b51' and url = 'https://www.startech.com.bd/apple-ipad-11-inch-11th-gen' and exists (select 1 from offers k where k.id = 'a0208ed0-51cb-460c-954b-771a2db5c561');
-- Star Tech | apple-ipad-11-inch-a16 256GB Wi-Fi | রাখা official
delete from offers where id = 'd8de1233-8332-400c-85b2-457228904a2b' and url = 'https://www.startech.com.bd/apple-ipad-11-inch-11th-gen' and exists (select 1 from offers k where k.id = 'e89c6024-ef0f-40be-8f4a-260563b5efc5');
-- Star Tech | apple-ipad-mini-a17-pro 128GB Wi-Fi | রাখা official
delete from offers where id = 'a2dea9e9-8997-49d9-9881-ef3b229af87d' and url = 'https://www.startech.com.bd/apple-ipad-mini-7' and exists (select 1 from offers k where k.id = '70b40dec-e5f0-42fb-90dd-62b80ded0368');
-- Star Tech | apple-ipad-pro-11-inch-m5 256GB Wi-Fi + Cellular | রাখা official
delete from offers where id = '962fd8ae-f6be-46d1-88cf-c5cf83cce2a0' and url = 'https://www.startech.com.bd/ipad-pro-m5-cellular' and exists (select 1 from offers k where k.id = '4f8d8f7e-5a3f-4e24-8cca-a8211460b4f7');
-- Star Tech | apple-ipad-pro-11-inch-m5 512GB Wi-Fi | রাখা official
delete from offers where id = '474c12ae-921a-47fd-a70f-f21c8eda227f' and url = 'https://www.startech.com.bd/ipad-pro-m5' and exists (select 1 from offers k where k.id = 'dd7a7bbd-1352-4367-b27a-e5d08048c07d');
-- Star Tech | apple-ipad-pro-13-inch-m5 256GB Wi-Fi | রাখা official
delete from offers where id = 'be6e9ff6-cd3c-473c-95a3-2b2c1911958c' and url = 'https://www.startech.com.bd/ipad-pro-m5-13-inch' and exists (select 1 from offers k where k.id = '308fc1e7-d0da-4b8d-9880-784f3feb64a5');
-- Star Tech | apple-ipad-pro-13-inch-m5 512GB Wi-Fi | রাখা official
delete from offers where id = '846f3ab9-4aa6-42dd-8deb-9941e9824243' and url = 'https://www.startech.com.bd/ipad-pro-m5-13-inch' and exists (select 1 from offers k where k.id = '01396035-29af-4166-805a-cbd006903ebe');
-- Star Tech | apple-mac-mini-m6 M6 16GB / 256GB | রাখা official
delete from offers where id = 'f593e959-83b5-4b3d-9cb1-cfb742a922a3' and url = 'https://www.startech.com.bd/apple-mac-mini-m6' and exists (select 1 from offers k where k.id = '11fa1774-83d5-43e5-843a-a0c88f32e9f1');
-- Star Tech | apple-mac-mini-m6 M6 16GB / 512GB | রাখা official
delete from offers where id = 'db34175c-aa69-48c7-80a6-cb3aee8e9570' and url = 'https://www.startech.com.bd/apple-mac-mini-m6' and exists (select 1 from offers k where k.id = 'c75166c9-002b-4fe4-95a1-2d36962aeb82');
-- Star Tech | apple-mac-studio-m5-max M5 Max 18C CPU/32C GPU 36GB / 512GB | রাখা official
delete from offers where id = 'a5559aab-8819-45c1-a944-46d7f3c8fefc' and url = 'https://www.startech.com.bd/apple-mac-studio-m5-max' and exists (select 1 from offers k where k.id = '303302fb-e189-4d58-a2bd-e02dfba9d47d');
-- Star Tech | apple-macbook-air-13-m5 M5 10-core GPU 16GB / 1TB | রাখা official
delete from offers where id = 'e15bfb71-d4f2-467d-8335-cc5eefb565e3' and url = 'https://www.startech.com.bd/apple-macbook-air-m5-13-inch-10-core-gpu' and exists (select 1 from offers k where k.id = '2471d07b-547c-497b-9388-e840f0539fd5');
-- Star Tech | apple-macbook-air-13-m5 M5 10-core GPU 24GB / 1TB | রাখা official
delete from offers where id = '7cc115ff-40e2-4242-bfb6-92c8d768bdeb' and url = 'https://www.startech.com.bd/apple-macbook-air-m5-13-inch-10-core-gpu' and exists (select 1 from offers k where k.id = '3ec4b462-6932-484a-b622-619c36ad1658');
-- Star Tech | apple-macbook-air-15-m5 M5 16GB / 512GB | রাখা official
delete from offers where id = '04e310c8-5078-4ea0-a8be-c4075d419cd3' and url = 'https://www.startech.com.bd/apple-macbook-air-m5-15-inch' and exists (select 1 from offers k where k.id = 'ffa76400-c1f2-4e05-8932-2b2c0e7bdc60');
-- Star Tech | apple-macbook-air-15-m5 M5 16GB / 1TB | রাখা official
delete from offers where id = '5a4b08ef-060c-4326-b5b7-0da8df4e34a6' and url = 'https://www.startech.com.bd/apple-macbook-air-m5-15-inch' and exists (select 1 from offers k where k.id = '2e34ec26-f877-4782-83e1-18924e29054e');
-- Star Tech | apple-macbook-neo A18 Pro 8GB / 512GB | রাখা official
delete from offers where id = 'f63c6f5e-4db4-4610-b774-7d12681344bc' and url = 'https://www.startech.com.bd/macbook-neo-512gb' and exists (select 1 from offers k where k.id = 'c44dd167-9c7a-4fd8-b15b-9c0236f60175');
-- Star Tech | apple-macbook-neo A18 Pro 8GB / 256GB | রাখা official
delete from offers where id = '07c68021-10eb-492f-8077-e11f89a293ee' and url = 'https://www.startech.com.bd/macbook-neo' and exists (select 1 from offers k where k.id = 'baba7aa8-a1cc-44f6-bf69-83e4387a284e');
-- Star Tech | apple-macbook-pro-14-m5 M5 16GB / 1TB | রাখা official
delete from offers where id = '0158e66d-3d34-495c-9d8b-edb2c139d7e3' and url = 'https://www.startech.com.bd/apple-macbook-pro-m5' and exists (select 1 from offers k where k.id = 'c4afb8a6-c1e3-4af2-a710-444430449590');
-- Star Tech | apple-macbook-pro-14-m5 M5 24GB / 1TB | রাখা official
delete from offers where id = '8638ffb1-d43a-4b48-84ea-94f9de00fe2b' and url = 'https://www.startech.com.bd/apple-macbook-pro-m5' and exists (select 1 from offers k where k.id = '17fadc01-cb3c-44af-a634-e08f8de465ac');
-- Star Tech | apple-macbook-pro-16-m5-pro M5 Pro 18C CPU/20C GPU 24GB / 1TB | রাখা official
delete from offers where id = '2355a3c4-27e6-4377-a4c7-44a70aaaaeee' and url = 'https://www.startech.com.bd/apple-macbook-pro-m5-pro-16-inch' and exists (select 1 from offers k where k.id = '0e0ab33f-b8c2-4a62-bb84-3fc9eb73585a');
-- Star Tech | apple-watch-series-11 46mm GPS | রাখা official
delete from offers where id = '382ad12d-e23c-4116-9777-8f74bba7ddab' and url = 'https://www.startech.com.bd/apple-watch-series-11' and exists (select 1 from offers k where k.id = '5db84ee7-a4cc-4460-960c-0652191dac6e');
-- Star Tech | samsung-galaxy-buds3-pro Standard | রাখা official
delete from offers where id = 'a6c278f4-1626-4e22-bc29-f90539285b7c' and url = 'https://www.startech.com.bd/samsung-galaxy-buds-3-pro-earbuds' and exists (select 1 from offers k where k.id = 'f03be7f5-e8ca-49d6-ac66-acd41133bf7e');
-- Star Tech | samsung-galaxy-watch8 40mm Bluetooth | রাখা official
delete from offers where id = 'a5c2c5c6-f383-4cd0-b0c7-924af7e1b5d8' and url = 'https://www.startech.com.bd/samsung-galaxy-watch8' and exists (select 1 from offers k where k.id = '326930f6-65a8-48c9-82e0-8450c36e3c06');

-- ৮. Dolbear নতুন সাইট: /product/<slug> এখন /products/<slug> (নতুন sitemap-এ মিলিয়ে); অপশন-বাঁধন খালি, পরের prices run নতুন করে বাঁধে
update offers set url = 'https://dolbear.com.bd/products/soundcore-r50i-nc', variant_key = null where id = 'b2658ca4-6113-4540-a907-ef9eecbc8b79' and url = 'https://dolbear.com.bd/product/soundcore-r50i-nc';
update offers set url = 'https://dolbear.com.bd/products/soundcore-space-one', variant_key = null where id = 'cd04a77c-1a71-4a56-97bd-b7ad986d1dfa' and url = 'https://dolbear.com.bd/product/soundcore-space-one';
update offers set url = 'https://dolbear.com.bd/products/google-pixel-10-pro-16-128gb', variant_key = null where id = '4eba899b-27ec-4707-9374-15d295111f72' and url = 'https://dolbear.com.bd/product/google-pixel-10-pro-16-128gb';
update offers set url = 'https://dolbear.com.bd/products/google-pixel-9-12-128gb', variant_key = null where id = '9e371496-08e1-4cc6-b200-4f70999b336a' and url = 'https://dolbear.com.bd/product/google-pixel-9-12-128gb';
update offers set url = 'https://dolbear.com.bd/products/google-pixel-9a-8-256gb', variant_key = null where id = 'd4b3bd93-e7c0-4f7a-87b0-d8846c386856' and url = 'https://dolbear.com.bd/product/google-pixel-9a-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/google-pixel-9a-8-128gb', variant_key = null where id = 'b39c4927-cb16-427e-8e0c-0466cd7cea91' and url = 'https://dolbear.com.bd/product/google-pixel-9a-8-128gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-hot-70-4-128gb', variant_key = null where id = '7f147012-3992-4183-9650-4e22635bef1a' and url = 'https://dolbear.com.bd/product/infinix-hot-70-4-128gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-hot-70-6-128gb', variant_key = null where id = 'a8b4290f-fef3-4d37-b576-048bc3676e33' and url = 'https://dolbear.com.bd/product/infinix-hot-70-6-128gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-hot-70-8-128gb', variant_key = null where id = '0b58f25d-abdd-427e-b220-e0e074465ebf' and url = 'https://dolbear.com.bd/product/infinix-hot-70-8-128gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-note-60-8-256gb', variant_key = null where id = 'b43ae78a-324c-499e-b9b7-c91cd779e569' and url = 'https://dolbear.com.bd/product/infinix-note-60-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-note-60-pro-8-256gb', variant_key = null where id = 'ebacaaaf-0061-4e9a-a79f-7d0133fed103' and url = 'https://dolbear.com.bd/product/infinix-note-60-pro-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-note-edge-8-256gb', variant_key = null where id = '7a7ce28b-1529-449b-972f-7eb82a46fa39' and url = 'https://dolbear.com.bd/product/infinix-note-edge-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-note-edge-8-128gb', variant_key = null where id = 'f7736fd3-f461-4f18-b5a6-f38eb17891ef' and url = 'https://dolbear.com.bd/product/infinix-note-edge-8-128gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-smart-20-4-64gb', variant_key = null where id = '1d06b70d-61d8-418a-a4a2-f7abd8ce095b' and url = 'https://dolbear.com.bd/product/infinix-smart-20-4-64gb';
update offers set url = 'https://dolbear.com.bd/products/infinix-smart-20-4-128gb', variant_key = null where id = 'ce7ab5ca-93e5-4fde-a561-27551873f0ea' and url = 'https://dolbear.com.bd/product/infinix-smart-20-4-128gb';
update offers set url = 'https://dolbear.com.bd/products/jbl-tune-125bt', variant_key = null where id = '38354319-182b-4397-b516-c961b949d616' and url = 'https://dolbear.com.bd/product/jbl-tune-125bt';
update offers set url = 'https://dolbear.com.bd/products/oppo-a6-6-128gb', variant_key = null where id = '77806592-7e26-46ba-86f5-0c26bc379e82' and url = 'https://dolbear.com.bd/product/oppo-a6-6-128gb';
update offers set url = 'https://dolbear.com.bd/products/oppo-a6-8-256gb', variant_key = null where id = 'fab9df63-e47e-4a82-8c1d-28687f40e31d' and url = 'https://dolbear.com.bd/product/oppo-a6-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/oppo-a6c-4gb-128gb', variant_key = null where id = '02852155-cc21-4f29-884a-0d12fbf02d58' and url = 'https://dolbear.com.bd/product/oppo-a6c-4gb-128gb';
update offers set url = 'https://dolbear.com.bd/products/oppo-a6x-4-64gb', variant_key = null where id = 'fa7fed1d-31e9-4d51-a71b-47ace0041dd9' and url = 'https://dolbear.com.bd/product/oppo-a6x-4-64gb';
update offers set url = 'https://dolbear.com.bd/products/oraimo-freepods-neo-true-wireless-earbuds-', variant_key = null where id = '32bb01bd-74c9-468b-899a-84f0ac9a910e' and url = 'https://dolbear.com.bd/product/oraimo-freepods-neo-true-wireless-earbuds-';
update offers set url = 'https://dolbear.com.bd/products/philips-bt1230-beard-trimmer-1000-series', variant_key = null where id = '9646269c-8b69-4a54-99f9-96b3bd971534' and url = 'https://dolbear.com.bd/product/philips-bt1230-beard-trimmer-1000-series';
update offers set url = 'https://dolbear.com.bd/products/qcy-ht05-melobudes-anc', variant_key = null where id = '6331cfcf-a6d2-455f-bd66-88376f7c5016' and url = 'https://dolbear.com.bd/product/qcy-ht05-melobudes-anc';
update offers set url = 'https://dolbear.com.bd/products/qcy-melobuds-n20-anc', variant_key = null where id = 'db3a5344-e4c7-4c77-9ce9-69dda9f9e8ab' and url = 'https://dolbear.com.bd/product/qcy-melobuds-n20-anc';
update offers set url = 'https://dolbear.com.bd/products/qcy-t13-anc-2', variant_key = null where id = '2112b797-44aa-4088-9ad9-3ab509462b58' and url = 'https://dolbear.com.bd/product/qcy-t13-anc-2';
update offers set url = 'https://dolbear.com.bd/products/qcy-tunearc-n1', variant_key = null where id = '20e2d08c-8e60-4b21-bfbd-07a083ccb900' and url = 'https://dolbear.com.bd/product/qcy-tunearc-n1';
update offers set url = 'https://dolbear.com.bd/products/realme-14-5g-8-256gb', variant_key = null where id = 'c6b8393f-c2cb-4c5a-96a6-6266f005afe0' and url = 'https://dolbear.com.bd/product/realme-14-5g-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/realme-14-5g-12-256gb', variant_key = null where id = '4dc15b08-94df-474e-bd40-b52420e241be' and url = 'https://dolbear.com.bd/product/realme-14-5g-12-256gb';
update offers set url = 'https://dolbear.com.bd/products/realme-buds-t200', variant_key = null where id = '0e185cd0-f6b1-4ccc-8568-c908db662668' and url = 'https://dolbear.com.bd/product/realme-buds-t200';
update offers set url = 'https://dolbear.com.bd/products/realme-buds-wireless-5-anc', variant_key = null where id = 'bf2aff69-185e-469f-9b43-afbc1bb20c2d' and url = 'https://dolbear.com.bd/product/realme-buds-wireless-5-anc';
update offers set url = 'https://dolbear.com.bd/products/realme-c100i-4-128gb', variant_key = null where id = '3e3f287d-6b87-49c0-be0b-7f514edca671' and url = 'https://dolbear.com.bd/product/realme-c100i-4-128gb';
update offers set url = 'https://dolbear.com.bd/products/tenda-ac10-ac1200-dual-band-router', variant_key = null where id = '2f6fe5d4-fb08-4bc3-af65-136de1cc3208' and url = 'https://dolbear.com.bd/product/tenda-ac10-ac1200-dual-band-router';
update offers set url = 'https://dolbear.com.bd/products/tenda-tx12-pro-v20-ax3000-dual-band-router', variant_key = null where id = 'fcfb7e61-0ad8-48e4-ab5b-1eb1bb79ca8b' and url = 'https://dolbear.com.bd/product/tenda-tx12-pro-v20-ax3000-dual-band-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-ax53-router', variant_key = null where id = 'c3fdb003-bda5-4ede-b94c-af8ac06600b3' and url = 'https://dolbear.com.bd/product/tp-link-archer-ax53-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-ax73-ax5400-dual-band-gigabit', variant_key = null where id = '9af004a6-0de7-427a-95a8-ad5d1fd44db0' and url = 'https://dolbear.com.bd/product/tp-link-archer-ax73-ax5400-dual-band-gigabit';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-be400-be6500-router', variant_key = null where id = '230e4a41-01f8-4cfd-a901-98c641cfeba7' and url = 'https://dolbear.com.bd/product/tp-link-archer-be400-be6500-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c24-router', variant_key = null where id = 'd91e4680-9b75-4fea-8372-89618bcfd564' and url = 'https://dolbear.com.bd/product/tp-link-archer-c24-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c50-ac1200-router', variant_key = null where id = '5f729c15-7446-45bd-8e65-5390e997c7f7' and url = 'https://dolbear.com.bd/product/tp-link-archer-c50-ac1200-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c54-ac1200-dual-band', variant_key = null where id = '063eed48-1581-446c-9f14-2c78fc3a8d55' and url = 'https://dolbear.com.bd/product/tp-link-archer-c54-ac1200-dual-band';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c6-ac1200-gigabit', variant_key = null where id = '9b6af63a-09b4-4e20-9b8f-deeb5e624ddb' and url = 'https://dolbear.com.bd/product/tp-link-archer-c6-ac1200-gigabit';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c64-ac1200-dual-band-gigabit', variant_key = null where id = '0f2dc288-9f11-42fd-bc81-d38c2506e491' and url = 'https://dolbear.com.bd/product/tp-link-archer-c64-ac1200-dual-band-gigabit';
update offers set url = 'https://dolbear.com.bd/products/tp-link-archer-c80-ac1900-dual-band-gigabit', variant_key = null where id = '6992264d-3bb8-48e4-938b-f1fa8395c5c0' and url = 'https://dolbear.com.bd/product/tp-link-archer-c80-ac1900-dual-band-gigabit';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-e4-ac1200-dual-band-mesh-router', variant_key = null where id = '88a7f1b6-1a88-4169-a82d-3d4fdec495c7' and url = 'https://dolbear.com.bd/product/tp-link-deco-e4-ac1200-dual-band-mesh-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-m4-ac1200-dual-band-mesh-router', variant_key = null where id = '42b598c2-d976-4059-bc23-80b89438bef8' and url = 'https://dolbear.com.bd/product/tp-link-deco-m4-ac1200-dual-band-mesh-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-m4-ac1200-route-1-pack', variant_key = null where id = '926f8ce1-f198-4f54-be47-a91e12847265' and url = 'https://dolbear.com.bd/product/tp-link-deco-m4-ac1200-route-1-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-m4-ac1200-route-2-pack', variant_key = null where id = '6d7d89d4-4332-4b5f-99a1-601a3448d54a' and url = 'https://dolbear.com.bd/product/tp-link-deco-m4-ac1200-route-2-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x10-ax1500-router-3-pack', variant_key = null where id = 'f8a8b933-0d38-4fbf-8cdd-73ce2fd17a9c' and url = 'https://dolbear.com.bd/product/tp-link-deco-x10-ax1500-router-3-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x10-ax1500-router-1-pack', variant_key = null where id = '3666308b-e8a0-4094-ab5f-50d5dda88fe8' and url = 'https://dolbear.com.bd/product/tp-link-deco-x10-ax1500-router-1-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x10-ax1500-router', variant_key = null where id = '627838ed-7810-4b1b-9c4f-b532702910dd' and url = 'https://dolbear.com.bd/product/tp-link-deco-x10-ax1500-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x20-ax1800-router', variant_key = null where id = 'b53a5df9-e3fb-4041-ad91-803a8b285bf3' and url = 'https://dolbear.com.bd/product/tp-link-deco-x20-ax1800-router';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x20-ax1800-router-3-pack', variant_key = null where id = 'c118c534-f33d-41e8-9801-8412e4ed920e' and url = 'https://dolbear.com.bd/product/tp-link-deco-x20-ax1800-router-3-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x20-ax1800-router-1-pack', variant_key = null where id = 'd731f9ae-45d8-44b9-8992-f40180f51b25' and url = 'https://dolbear.com.bd/product/tp-link-deco-x20-ax1800-router-1-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x50-ax3000-router-', variant_key = null where id = '15c35186-008e-4e59-a053-c6569659d7f4' and url = 'https://dolbear.com.bd/product/tp-link-deco-x50-ax3000-router-';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x50-ax3000-router-1-pack', variant_key = null where id = 'ce2aecc2-0e1d-4dcb-bfb6-1111d0fcd9e1' and url = 'https://dolbear.com.bd/product/tp-link-deco-x50-ax3000-router-1-pack';
update offers set url = 'https://dolbear.com.bd/products/tp-link-deco-x50-ax3000-router-3-pack', variant_key = null where id = 'd12422e1-24d6-4278-a477-0796ef90076c' and url = 'https://dolbear.com.bd/product/tp-link-deco-x50-ax3000-router-3-pack';
update offers set url = 'https://dolbear.com.bd/products/vivo-v70-fe-5g-12-256gb', variant_key = null where id = '2c74c028-9d29-4edd-a019-337aab207032' and url = 'https://dolbear.com.bd/product/vivo-v70-fe-5g-12-256gb';
update offers set url = 'https://dolbear.com.bd/products/vivo-v70-fe-5g-8-256gb', variant_key = null where id = '08c83357-98fc-434b-9962-2cb3e3bc649a' and url = 'https://dolbear.com.bd/product/vivo-v70-fe-5g-8-256gb';
update offers set url = 'https://dolbear.com.bd/products/vivo-y05-4-64gb', variant_key = null where id = '46f56355-c643-443e-8db2-80d1749ff1a3' and url = 'https://dolbear.com.bd/product/vivo-y05-4-64gb';
update offers set url = 'https://dolbear.com.bd/products/vivo-y05e-4-64gb', variant_key = null where id = '7755ac0f-ed68-438d-b9f4-fc213b5e2694' and url = 'https://dolbear.com.bd/product/vivo-y05e-4-64gb';
update offers set url = 'https://dolbear.com.bd/products/vivo-y31d-4-128gb', variant_key = null where id = 'c7990f4b-048c-4cdf-99b9-6f7832638194' and url = 'https://dolbear.com.bd/product/vivo-y31d-4-128gb';
update offers set url = 'https://dolbear.com.bd/products/vivo-y31d-8-256gb', variant_key = null where id = '255a3de6-5ec8-461a-a677-25fe62f82fd2' and url = 'https://dolbear.com.bd/product/vivo-y31d-8-256gb';
-- নতুন সাইটে পণ্যটাই নেই: স্টক নেই (পণ্য SEO-র জন্য থাকে)
update offers set in_stock = false where id = '5d1a82c4-486d-4dfe-ac05-fa6450f44ea8' and url = 'https://dolbear.com.bd/product/oraimo-watch-5-lite';
update offers set in_stock = false where id = '68ce8268-58d2-4a19-8784-6081522ee093' and url = 'https://dolbear.com.bd/product/vgr-v-185-professional-hair-clipper-and-beard-trimmer';
update offers set in_stock = false where id = 'b5a06f84-1db1-400b-88b8-c85671076add' and url = 'https://dolbear.com.bd/product/vgr-v-932-professional-pocket-hair-trimmer';
update offers set in_stock = false where id = '169f17dd-ad3d-4c3e-b548-928dda9e5c57' and url = 'https://dolbear.com.bd/product/vgr-v-937-cord-cordless-hair-clipper-and-beard-trimmer';
update offers set in_stock = false where id = '018b3fdc-31ee-4361-988a-7ba9309ddafa' and url = 'https://dolbear.com.bd/product/vgr-v-963-cordless-beard-hair-trimmer';
-- ৯. Watch Series 11 46mm GPS + Cellular: মালিকের সিদ্ধান্ত, পাতায় Cellular অপশন না থাকলেও একই পণ্য ধরে রাখা ও যোগ
update offers set in_stock = false where id = '484f4118-8711-429c-873b-f0bee57d150d' and url = 'https://www.maczenbd.com/products/apple-watch/apple-watch-series-11';  -- MacZen: পাতায় GPS+Cellular stock-out
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select 'c6a81bfd-f817-d3a9-ddd4-a63e2357c633', s.id, 'unofficial', null, 46999, null, true, 'https://www.sumashtech.com/product/apple-watch-series-11', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%sumashtech.com%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select 'c6a81bfd-f817-d3a9-ddd4-a63e2357c633', s.id, 'official', null, 45499, null, true, 'https://riointernational.com.bd/product/apple-watch-series-11', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%riointernational.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select 'c6a81bfd-f817-d3a9-ddd4-a63e2357c633', s.id, 'official', null, 41300, null, true, 'https://www.skyland.com.bd/apple-watch-series-11', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%skyland.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select 'c6a81bfd-f817-d3a9-ddd4-a63e2357c633', s.id, 'official', null, 50999, null, true, 'https://gadgetandgear.com/product/apple-watch-series-11', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%gadgetandgear.com%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
-- ProBook 440 G11 Ultra 7 155U 8GB/512GB: পাতায় 8GB DDR5, 512GB মিলিয়ে
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select '1372dd3e-419b-4fdb-8efb-a8315eb59318', s.id, 'unofficial', null, 117900, null, true, 'https://www.applegadgetsbd.com/product/hp-probook-440-g11-intel-core-ultra-7-155u-laptop', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%applegadgetsbd.com%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select '1372dd3e-419b-4fdb-8efb-a8315eb59318', s.id, 'official', null, 136999, null, true, 'https://www.pqs.com.bd/hp-probook-440-g11-core-ultra-7-14-fhd-laptop', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%pqs.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select '1372dd3e-419b-4fdb-8efb-a8315eb59318', s.id, 'official', null, 138000, null, true, 'https://www.pchouse.com.bd/hp-probook-440-g11-core-ultra-7-14-inch-laptop', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%pchouse.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select '1372dd3e-419b-4fdb-8efb-a8315eb59318', s.id, 'official', null, 139800, null, true, 'https://computervision.com.bd/hp-probook-440-g11-core-ultra-7-laptop', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%computervision.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;
-- Tab S10 Ultra 12GB/512GB Wi-Fi: পাতায় RAM 12GB, Storage 512GB (এখন স্টক নেই)
insert into offers (variant_id, seller_id, condition, region, price, old_price, in_stock, url, source, checked_at) select '32576ca5-b703-acaa-bd95-056ac72da243', s.id, 'official', null, 157000, null, false, 'https://www.pchouse.com.bd/samsung-galaxy-tab-s10-ultra-wi-fi-14.6-inch-tablet', 'site', '2026-11-12 12:00+06' from sellers s where s.website ilike '%pchouse.com.bd%' limit 1 on conflict (variant_id, seller_id, condition) do nothing;

-- ১০. ১ দোকানে নামা ভার্সন, মালিকের সিদ্ধান্তে বাদ (seed.sql-এ নেই, worker-জোড়া; অফার cascade-এ যায়)
delete from variants where id = '21f5255f-8347-467d-af08-f0bb543eebac' and label = '12GB / 256GB';  -- Honor Magic8 Pro, শুধু Dazzle
delete from variants where id = '56ac2c99-e11c-4753-91da-2e6c876ada01' and label = '50ml';  -- Sebamed Clear Face Foam, শুধু IndianMart

commit;
