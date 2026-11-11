# সাইট-দোকান ভার্সন-অমিল যাচাই (১২ নভেম্বর ২০২৬) — খসড়া নোট, এখনো কিছু বদলানো হয়নি

**সারসংক্ষেপ:** ৮,৫৫৬ অফারের মধ্যে পাতার শিরোনাম দিয়ে **প্রমাণিত ভুল ৫টা** (নিচের টেবিল), **সম্ভাব্য ~১৫টা** payload যাচাই বাকি, বাকি সন্দেহগুলো পাতা পড়ে **ঠিক** প্রমাণ হয়েছে (slug-ফাঁদ)। পুরো সুইপটা ৬,৬০০/৬,৯৬৮ পাতায় বন্ধ করা হয়েছে (মালিকের নির্দেশে); বাকি ছিল মূলত iStockBD, CustomMacBD, OHSOGO — ওদের রেট-লিমিটে পড়া ধীর বলে। কোনো SQL চলেনি, কোনো অফার মোছা বা সরানো হয়নি; ঠিকগুলো পরে নেওয়া হবে। এই নোট আর `workers/audit-links.ts` নতুন ফাইল — সাইটের বিল্ডে কোনোটাই ঢোকে না (`npm run typecheck`, `lint`, `build` তিনটাই পাস)।

## কীভাবে যাচাই হলো

1. ডিবি থেকে ৮,৫৫৬ published অফার (৬,৯৬৮ লিংক) ডাম্প নিয়ে (`/tmp/dordam-site-shop.json`) স্লাগ-শিরোনাম মিলিয়ে প্রথম সারি বাছা (`workers/audit-links.ts`, নতুন read-only স্ক্রিপ্ট, `--slug-only`)।
2. সন্দেহভাজন ৬২ পাতা আলাদাভাবে খুলে আসল শিরোনাম দেখা (DordamBot UA)।
3. সব পাতা পড়ে payload-সহ মেলানোর পুরো সুইপ ৬,৬০০/৬,৯৬৮ পাতায় বন্ধ করা হয়েছে — ফল ফাইলে আসেনি (শেষেই লেখত)। বাকি পড়া হয়নি মূলত iStockBD, CustomMacBD, OHSOGO আর কয়েকটা ছোট দোকান; পরে চালাতে চাইলে নিচের কমান্ড।

## নিশ্চিত অমিল (পাতার আসল শিরোনাম দিয়ে প্রমাণিত)

| পণ্য | ভার্সন | দোকান | দাম | পাতায় যা আছে | offer id |
|---|---|---|---|---|---|
| ACI Pure Multifloral Honey | 250g | Shajgoj | ৳১২০ | শিরোনামে **100gm** | `afb43b3b-f96a-4208-a4e0-657391f91197` |
| Meril Baby Lotion | 200ml | eFamas | ৳২০০ | শিরোনামে **100ml** | `d3a708e4-d196-4ecb-a647-c03bbbe7d54a` |
| Parachute Just For Baby Face Cream | 50g | eFamas | ৳২৫০ | পাতাটা **Milky Glow Face Cream 100ml** — অন্য পণ্যই | `5e1c2e49-7fb4-4579-90da-ad66f5fca1b3` |
| Maybelline Sky High Mascara | 7.2ml | UK Direct BD | ৳১,৪৯০ | শিরোনামে **6ml** | `e02295b0-b302-4d56-9e31-092fcb66fd1a` |
| Ajwa Dates (Holy Basket) | **1kg** | Holy Basket | ৳৮৫০ | পাতা **500gm**; একই দামে 500g অফারও আছে — 1kg-টা ভুল | `5aa38aee-0307-4b31-a62d-f2dc2c3befc2` |

## সম্ভাব্য অমিল (সুইপ বা payload যাচাই বাকি)

- **MacBook Pro 14 M4 @ iStockBD:** `macbook-pro-14-inch-m4-price-in-bd` এক পাতায় আমাদের ৭টা অফার — M4 ×৩, **M4 Pro ×২, M4 Max ×২**। iStockBD পাতায় config টেবিল থাকে, তাই payload পড়ে দেখতে হবে কোন কনফিগগুলো সত্যিই ওই পাতায় আছে (curl-এ 429, সুইপ ৬০ সেকেন্ড পেসে পড়ছে)।
- **MacBook Pro 14 M5 @ Mobile Buzz:** `16gb-1tb` পাতায় 16GB/1TB-এর সাথে **24GB/1TB (৳২৭৫,৫০০)** আর **16GB/512GB (৳২৪২,৯৯৯)** অফার।
- **Deco X50 @ Gadget Breeze:** `3-pack` লিংকে **1 Pack (৳৭,৪৮০)** আর **2 Pack (৳১৪,৯৮০)** অফারও বসানো।
- **HP 255R G10 @ Tech Marvels:** 16GB/512GB অফার `8gb-512gb` লিংকে; শিরোনামে RAM নেই, পাতার স্পেক দেখতে হবে।
- **SKIN1004 Ampoule @ ALZAK (৬টা):** 30ml/50ml ভার্সনের অফার 95ml/100ml লিংকে (slug-এই বড় সাইজ লেখা)।
- **Sudocrem @ OHSOGO:** 125g অফার `60g` লিংকে (429, পেসে পড়া হচ্ছে); **Sudocrem @ ALZAK:** 125g অফার `30gm-2` লিংকে।
- **Nivea Soft 50ml @ Her Happy Skin:** `100ml` লিংকে।
- **Kry (JS পাতা, curl-এ শিরোনাম আসেনি):** Nord CE5-এর এক লিংক `oneplus-nord-ce-5` পাতার শিরোনাম **"Nord CE5 Slim Box"**; Redmi Pad 2 11"-এর ২ অফার `redmi-pad-2-official` লিংকে — payload পড়ে দেখতে হবে (strict-rules 12a)।
- **Sumash (12a দোকান):** IdeaPad Slim 3 i7 16GB অফার i5-এর লিংকে — payload যাচাই বাকি।
- **BanglaShoppers (Cloudflare "Just a moment"):** Kodomo 180ml `200ml` লিংকে, Beauty of Joseon 150ml লিংকে — worker-এর নিজের পথে সুইপ পড়বে।
- **EmartWay:** Cetaphil Baby Lotion 399ml অফারের পাতা curl-এ ফাঁকা "Search" — সুইপে দেখা হবে।

## CeraVe প্রশ্ন (মালিকের সিদ্ধান্ত)

Nov-10 অডিটে "Daily Moisturizing Lotion" (US) আর "Moisturising Lotion" (UK) দুটো আলাদা পণ্য করা হয়েছিল, কিন্তু দোকানগুলো নাম মেশায়:

- **Klassy** `cerave-daily-moisturizing-lotion-for-dry-to-very-dry-skin-473ml` — শিরোনাম "Daily **Moisturising** Lotion For Dry To Very Dry"; আমাদের **দুই** পণ্যেই একই লিংকে ৳২,৯৯০ অফার (`ed584851`, `c1f9daa7`)।
- **Beauty Booth** `cerave-daily-moisturizing-lotion-uk473ml` — শিরোনাম "Daily Moisturizing Lotion **USA** 473ml"; দুই পণ্যেই অফার (`34bf53c3`, `c21cb718`)।
- **Beprincess** "Moisturising Lotion For Normal to Dry Skin **87ml**" — US পণ্যের 87ml ভার্সনে (`38324c77`); UK পণ্যের ভার্সন 88ml।
- **ALZAK** "Daily Moisturizing Lotion 87ml" আর **Korean Mart** "Daily Moisturizing Lotion 87ml USA" — দুটোই US পণ্যে ঠিকই আছে (স্লাগে "travel size"/বানানে ফ্ল্যাগ হয়েছিল, শিরোনামে ঠিক)।

আসল CeraVe-তে UK "Moisturising Lotion" আর US "Daily Moisturizing Lotion" একই পণ্যের দুই বানান — দুই পণ্য রাখা ঠিক না এক করা, সেটা মালিক ঠিক করুন। ততদিন এদের ছুঁয়া উচিত নয়।

## ভুল সংকেত (ফ্ল্যাগ হয়েছিল, কিন্তু পাতা পড়ে ঠিক প্রমাণ হলো)

- **Shajgoj-র লিংকে সাইজ ×10 বেশি লেখা** (slug `500-gm`, পাতায় "50.0 gm") — Dabur honey ৪ অফার, Nivea Soft 50ml, Sudocrem 125g, Cetaphil 237ml সব **ঠিক**; BD Amajan-এর লিংকও উল্টো ক্রস (slug 473ml/250g/177ml, শিরোনাম ঠিক)।
- **Nord CE5 @ Arafa/Mobile Buzz/G&G/Sumash:** শিরোনাম "OnePlus Nord CE5" — ঠিক (slug-এর `ce5` ভেঙে "ce"+"5" হয়ে "Nord 5"-এ মিলে যাচ্ছিল)।
- **Redmi Note 15 @ Arafa:** পাতা আসলেই Note 15 — ঠিক (Nov-10 অডিটের ভুল লিংকগুলো আলাদা, ওগুলো বাদই আছে)।
- **Vertech-এর Watch8 Classic পাতা** সত্যিই Classic; **Kry Reno15 F** পাতা Reno15 F; kajal/mascara-র "claimed same" ফ্ল্যাগগুলো ভার্সন-id গোলমাল, সাইজ মিল — ঠিক।

## পরে ঠিক করার ধরন (এখনো চলেনি)

প্রমাণিত ৫টার জন্য [2026-11-11-wrong-offers-niacinamide-dup.sql](batches/2026-11-11-wrong-offers-niacinamide-dup.sql)-এর প্যাটার্ন: `insert ... review_queue ('match','rejected', কারণসহ)` তারপর `delete from offers where id = ... and url = ...` — যাতে discover একই ভুল লিংক আবার না বসায়। Meril/Parachute-এর মতো যেগুলোর ঠিক পাতা আমাদের ক্যাটালগে আছে সেগুলো সরিয়ে সঠিক পণ্যে লাগানো যায় (Discover বাদ)। সিদ্ধান্ত মালিকের; ব্যাচ তখনই বানানো হবে।

## আবার চালানো

```sh
# ডাম্প (read-only)
npx supabase db query --linked "select (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (select p.id as product_id, p.slug as product_slug, p.name as product_name, p.brand, p.category, p.release_year, p.active, v.id as variant_id, v.label as variant_label, v.sku from products p join variants v on v.product_id = p.id order by p.slug, v.position) t) as catalog, (select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb) from (select o.id as offer_id, o.url, o.price, o.condition, o.in_stock, o.expires_at, v.id as variant_id, v.label as variant_label, p.id as product_id, p.slug as product_slug, p.name as product_name, p.brand, p.category, p.release_year, p.active, s.name as seller from offers o join variants v on v.id = o.variant_id join products p on p.id = v.product_id join sellers s on s.id = o.seller_id where o.published and o.price > 0 and (o.expires_at is null or o.expires_at > now()) order by p.slug) u) as offers;" > /tmp/dordam-site-shop.json
# পুরো যাচাই (পাতা পড়ে, কিছু লেখে না)
node --import tsx workers/audit-links.ts /tmp/dordam-site-shop.json --out=/tmp/audit-full.jsonl
# শুধু লিংক-শিরোনাম দ্রুত যাচাই
node --import tsx workers/audit-links.ts /tmp/dordam-site-shop.json --slug-only
```
