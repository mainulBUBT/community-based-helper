# সাইট-দোকান ভার্সন-অমিল যাচাই (১২ নভেম্বর ২০২৬)

**সারসংক্ষেপ:** ৮,৫৫৬ published অফার (৬,৯৬৮ লিংক) পড়া হলো; ৬,৬৩৫ লিংক পড়া গেছে, ৩৩৩টা রেট-লিমিট বা ভাঙা লিংকে আটকেছে। সন্দেহের ১০৩টা পাতা আবার খুলে পুরো payload (সব অপশন আর দাম) মিলিয়ে দেখা হয়েছে। আসল ভুল প্রায় **১০০ অফার** (নিচে ভাগ করে), আর **৬৫ জোড়া** দ্বৈত অফার। Dolbear সাইট বদলেছে, তাই **৬৬টা লিংক** ভাঙা। ঠিক করার ব্যাচ: [2026-11-12-site-shop-mismatch.sql](../supabase/batches/2026-11-12-site-shop-mismatch.sql) — ভুল ৯৪ অফার মোছা, Reno15 F-এর ২টা সঠিক পণ্যে সরানো, Redmi Pad 2 Pro Cellular-এর দাম ঠিক, দ্বৈত অফারের ২৯টা বাড়তি কপি মোছা, Dolbear-এর ৬১ লিংক নতুন ঠিকানায় আর ৫টা স্টক নেই। পাতায় official/unofficial আলাদা অপশন ও আলাদা দাম থাকলে (Mobile Buzz) দুটোই রাখা হয়েছে। CeraVe, Laneige, Cetaphil-এর দ্বৈত ভার্সন আর Niacinamide মালিকের সিদ্ধান্তে বাকি।

ইতিমধ্যে কোডে ঠিক হয়েছে (কমিট বাকি):
- **MacZen parser:** `combinationPrices`-এর `sim` (WiFi / Wi-Fi + Cellular / GPS / GPS+Cellular) বাদ পড়ত, তাই Cellular ভার্সনে Wi-Fi-র দাম বসত। এখন আলাদা অপশন ([parsers.ts](../workers/stores/parsers.ts))।
- **CPU/GPU core:** MacZen আর Dazzle "8‑core" লেখে non-breaking hyphen (U+2011) দিয়ে, matcher চিনত না; iMac 8C/10C এক হয়ে যেত ([variants.ts](../workers/lib/variants.ts))।
- **যাচাই স্ক্রিপ্ট** ([audit-links.ts](../workers/audit-links.ts)): এক লিংকে টগল-ভার্সনের পাতায় শিরোনাম নয়, অফারের বাঁধা অপশন (`variant_key`) পাতায় আছে কি না আর আমাদের ভার্সনে মেলে কি না দেখে; একই অপশনে দুই ভার্সন বাঁধা থাকলে ধরে; প্রতি পাতার ফল সাথে সাথে ফাইলে লেখে, আবার চালালে বাকিটুকু পড়ে।

## ১. সাইজ বা পণ্য ভুল (আলাদা-লিংকের দোকান)

| দোকান | পণ্য | আমাদের | পাতায় | offer |
|---|---|---|---|---|
| Shajgoj | ACI Pure Multifloral Honey | 250g | 100gm | `afb43b3b` |
| eFamas | Meril Baby Lotion | 200ml | 100ml | `d3a708e4` |
| eFamas | Parachute Just For Baby Face Cream | 50g | Milky Glow Face Cream 100ml (অন্য পণ্য) | `5e1c2e49` |
| UK Direct BD | Maybelline Sky High Mascara | 7.2ml | 6ml | `e02295b0` |
| Shajgoj | Maybelline Sky High Mascara | 7.2ml | 6ml | `662c5fe4` |
| Holy Basket | Ajwa Dates | 1kg | 500gm | `5aa38aee` |
| Khaas Food | Ajwa Dates | 1kg (৳১,০৫০) | শুধু 250g/500g; ৳১,০৫০ = 500g | `67401c8f` |
| Khaas Food | Maryam Dates | 1kg (৳১,০৫০) | শুধু 250g/500g | `e30a4503` |
| Shajgoj | Sebamed Clear Face Foam | 50ml | 150ml (150ml অফার আলাদা আছে) | `2963e46a` |
| Beauty Booth | Etude Dear Darling Water Tint | 9g | 4.5ml | `f860edac` |
| Sumash Tech | HP ProBook 460 G11 | 8GB | শিরোনামে 16GB RAM | `022aeb94` |
| Perfecto | CeraVe Cream-to-Foam Cleanser | 87ml ও 236ml একই পাতায়, এক দাম ৳১,৩০০ | একটাই সাইজ; ৳১,৩০০ মানে 236ml | `2eea1bb7` (87ml) |
| Shajgoj | Cetaphil Moisturizing Lotion | 236ml ও 237ml | 250ml | `0559570f`, `15483e92` |

## ২. মডেল ভুল (ল্যাপটপ, iMac, ফোন)

- **Dazzle ThinkPad E14:** পাতা **Gen 6 Ultra 7 155H**; Gen 7-এর ৩ অফার (`f485bc44`, `8e803be4`, `bb261b5d`) ভুল।
- **IdeaPad Slim 3 15IRH10:** Dazzle আর Apple Gadgets দুই পাতাই **i5-13420H**; i7 অফার ভুল — Dazzle `8adfb1ad`, Apple Gadgets `c3715167`, `f275155a`।
- **Apple Gadgets ProBook 440 G11:** পাতা Ultra 5 125U; Ultra 7 155U অফার `79ff51ef` ভুল।
- **Sumash LOQ 15IRX10:** পাতা i5 13th Gen 24/512; i7-এর ২ অফার (`dda89919`, `995109d9`) ভুল।
- **iMac M4 10C GPU 8-core পাতায়:** MacZen `74579905`, HNS Tech `7c839145`, Mobile Buzz `f567bc63`, Dazzle `15cc4760` (24GB) — ভুল; Dazzle `5e9e908d` সম্ভবত ভুল।
- **Reno15 F পাতা Oppo Reno15-এ:** Mobile Buzz `f087de0d`, Dazzle `3cbe6594`, Kry `885295a7` (ঠিক জায়গা `oppo-reno15-f-5g`); Dazzle **Reno15 FS** পাতা `a12b6d92`।
- **Nord CE5 পাতা Nord 5-এ:** Arafa `f4bb801c` (একই লিংকে CE5-এর অফার আগে থেকেই আছে)।

## ৩. Wi-Fi/Cellular বা GPS/Cellular গোলমাল (একই লিংকে টগল)

পাতায় কানেক্টিভিটির অপশন নেই বা লিংকটা একটারই, অথচ দুই ভার্সন একই দামে বসানো:
- **Arafa:** iPad 11 Cellular `7145bf0b`, Honor Pad X9 Cellular `d6859d54`, Tab S10 FE Cellular `79d0be64`, Redmi Pad 2 Cellular `a511cf33`, Redmi Pad Pro Cellular `895ce781`। Tab S10 Ultra-র লিংক "wifisim" (Cellular), তাই উল্টো — Wi-Fi অফার `003099bd`, `219ed758` ভুল। Redmi Pad 2 Pro-র পাতায় 4G ৳৩৭,৯৯৯ আর **5G ৳৪৪,৯৯৯**; আমাদের Cellular `f282e216` ৳৩৭,৯৯৯-এ (matcher 5g-কে Cellular ধরে না)।
- **Dazzle:** OnePlus Pad Lite `1c645782`, Tab S10+ `a2d72ec5`, Redmi Pad Pro `c0ff5657`, Redmi Pad SE 8.7 `a72a6b81` — সব Cellular।
- **Diamu** Pad Go 2 `c524a13b`, **Apple Gadgets** Pad Go 2 `99395cc3`, **Mobile Buzz** Honor Pad X9 `7806e055` — Cellular।
- **Star Tech:** iPad mini 7 Cellular `f7ffa86e`; `ipad-pro-m5-cellular` লিংকে Wi-Fi অফার `43a3d436`; iPad Pro 13 M5 (Wi-Fi পাতা) Cellular `149ac6af`, `ca781d3e`; Watch 46mm Cellular `eacf47b3`।
- **Watch Series 11 Cellular:** HNS Tech `baa77721`, `1bdbd97d`; Gadget Breeze `7b8a4f5f`, `e2206ff8`।
- **MacZen (পাতায় Call for price / stock-out, সাইটে Wi-Fi-র দাম):** `024160ef`, `a54f0a30`, `c43765cb`, `70802601`, `88ff0271`, `20cf72b4`, `484f4118`।
- **Gadget Breeze Tab A11:** পাতায় শুধু Wi-Fi/Cellular, RAM নেই; 8/128 Cellular `a12a0186` সম্ভবত ভুল (একই দাম 4/64-এর সাথে)।

## ৪. পাতায় আর নেই এমন ভার্সন (সাইটে পুরনো দাম দেখাচ্ছে)

বেশিরভাগের দাম পাতার অন্য ভার্সনের দামের সমান — শুরু থেকেই ভুল বাঁধা ছিল:
- **Apple Gadgets:** iPhone Duo 256GB/1TB/2TB (`8cf2354f`, `4f31fb66`, `e79796d2`), Magic8 Pro 12/256 `093ed16c`, OnePlus 15R 12/512 `6c8221a1`, A17 8/256 `981ddb9a`, A36 6/128 `26ff2a4e`, A56 8/128 `fe0dbc8b`।
- **Diamu:** iPhone Duo 256GB/1TB/2TB (`a0011f08`, `8c7f03ec`, `a340ed66`)।
- **Kry:** Edge 70 Fusion 8/128 `749483af`, Motorola Signature 16/512 `db5acf11`, Nothing Phone 3a ×২ (`055ef01b`, `9f036745`), 3a Lite 8/256 `555d5f43`, Reno15 Pro 512 `e0ee827f`, A56 8/256 `69d9ecea`, Redmi 15C 8/256 `499f183c`।
- **Rio:** M16 8/128 `eb7aba5a` (পাতা 6/128), S25+ 12/512 `6faa990c` (12/256), Tab S10+ 12/512 `9fca73c0` (12/256), Pad 7 Pro 8/256 `99d30f90` (12/512)।
- **Sumash:** A17 8/256 `0367a463`, Tab S10 FE 12/256 `ef90a6df`, Spark Go 3 4/128 `2f0cf54f`।
- **Star Tech:** Spark 50C 4/128 `eb35ebca`; Watch 42mm-এর ৩ অফার (`8f57e795`, `5881193d`, `3779a6ca`) — পাতায় এখন শুধু 46mm।
- **Dazzle:** Honor 600 Pro 12/512 `f6ed88c7`; IdeaPad Slim 3 14 16GB/1TB `cba9486f` (সম্ভবত)।

## ৫. দ্বৈত অফার (একই লিংক, একই ভার্সন, official আর unofficial দুটোই)

৬৫ জোড়া, বেশিরভাগ Star Tech (iPad, MacBook, Mac mini, Watch), MC Solution, Apple Gadgets, Mobile Buzz, Othoba। দাম একই, শুধু condition আলাদা — একই দোকান দুইবার দেখায়। প্রতি জোড়ায় কোনটা রাখা হবে তা দোকানের ধরন (official বিক্রেতা কি না) দেখে ঠিক করতে হবে।

## ৬. Dolbear সাইট বদলেছে

পুরনো লিংক `/product/<slug>` এখন 404; নতুন সাইটে `/products/<slug>`। ৬৬ লিংকের ৬১টা নতুন sitemap-এ একই slug-এ আছে আর parser পড়তে পারে (যাচাই: soundcore Space One ৳৭,৭৯৯, R50i NC ৳২,৩৯০)। ৫টা নেই: oraimo Watch 5 Lite, VGR V-185, V-932, V-937, V-963। স্টোর কনফিগের `sample` লিংকও পুরনো।

## মালিকের সিদ্ধান্ত লাগবে

- **CeraVe UK/US:** Klassy, Beauty Booth, Beprincess আর Her Happy Skin-এর লিংক দুই পণ্যেই বসানো (আগের নোটের মতোই)।
- **ক্যাটালগে দ্বৈত ভার্সন:** Laneige Water Sleeping Mask-এ "15ml" আর "EX 15ml" দুটো ভার্সন, ৪টা দোকানের EX পাতা "15ml"-এও বসানো (`b8147beb`, `1c1d6a19`, `d3c02737`, `d195e985`); Cetaphil-এ 236ml আর 237ml।
- **Niacinamide দ্বৈত পণ্য:** `the-ordinary-niacinamide-10-zinc-1-30ml` আর `…-serum-30ml` দুটোই এখনো active ([১১ নভেম্বরের ব্যাচ](../supabase/batches/2026-11-11-wrong-offers-niacinamide-dup.sql) চলেনি মনে হয়)।

## ভুল সংকেত (পাতা পড়ে ঠিক প্রমাণিত)

- Nord CE5 (Arafa, Mobile Buzz, G&G, Kry, Sumash), Redmi Note 15 (Arafa), Redmi Pad 2 11" (Kry, Diamu), Tab A9 LTE (Arafa "Sim+wifi"), ADATA SC735 "1000GB" = 1TB, OnePlus Pad Go "LTE" = Cellular, Mobile Buzz MacBook Pro M5 Max "32/2tb" (৩২-core GPU), Sumash Pixel 9 Pro (দোকান 12GB লিখেছে, দাম মেলে)।
- "পণ্যই চেনা যায়নি" ৪৭১টা: নমুনা দেখে সব ঠিক পাতা, matcher শিরোনামে কড়া বলে।

## পড়া যায়নি

CustomMacBD ৯২, OHSOGO ৬৫, iStockBD ৩৬, Ragen ১৪, Splayd ১০, Sneaker Zone ৮ (সবই 429); Computer Village ২৮ (ভাঙা লিংক বা 500)। ধীরে আলাদা করে চালাতে হবে।

## matcher-এ পরে ঠিক করার

- "Nord CE5" → Nord 5, "Reno15 F/FS" → Reno15: discover এভাবেই ভুল পণ্যে লিংক বসিয়েছে।
- ট্যাবলেটের "5g/4g" অপশন Cellular হিসেবে ধরা হয় না।

## আবার চালানো

```sh
# ডাম্প (read-only), variant_key সহ
npx supabase db query --linked "select (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (select p.id as product_id, p.slug as product_slug, p.name as product_name, p.brand, p.category, p.release_year, p.active, v.id as variant_id, v.label as variant_label, v.sku from products p join variants v on v.product_id = p.id order by p.slug, v.position) t) as catalog, (select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb) from (select o.id as offer_id, o.url, o.price, o.condition, o.in_stock, o.expires_at, o.variant_key, v.id as variant_id, v.label as variant_label, p.id as product_id, p.slug as product_slug, p.name as product_name, p.brand, p.category, p.release_year, p.active, s.name as seller from offers o join variants v on v.id = o.variant_id join products p on p.id = v.product_id join sellers s on s.id = o.seller_id where o.published and o.price > 0 and (o.expires_at is null or o.expires_at > now()) order by p.slug) u) as offers;" > /tmp/dordam-site-shop.json
# পুরো যাচাই (থামলে আবার একই কমান্ড — আগে পড়া পাতা বাদ যায়)
node --import tsx workers/audit-links.ts /tmp/dordam-site-shop.json --out=/tmp/audit-full.jsonl
# এক দোকান
node --import tsx workers/audit-links.ts /tmp/dordam-site-shop.json --only=maczenbd --out=/tmp/audit-maczen.jsonl
```
