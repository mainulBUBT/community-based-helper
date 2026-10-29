# ১৭ ডেটার উৎস আর নিয়ম

**অবস্থা:** ✅ সিদ্ধান্ত নেওয়া (২০ অক্টোবর ২০২৬)

## যে দোকান থেকে দাম আসবে

| দোকান | listing কোথা থেকে | ভার্সনের দাম কোথা থেকে | অবস্থা |
|---|---|---|---|
| Star Tech | ক্যাটাগরি পাতা (ফোন, iPad, ট্যাবলেট, Mac, iMac, Mac mini/Studio, ঘড়ি, ইয়ারবাড, হেডফোন) | `/product/product/variation` (ব্রাউজার যেভাবে চায়) | ✅ |
| Apple Gadgets | product sitemap | Next.js payload | ✅ |
| Gadget & Gear | sitemap | Next.js payload (Playwright লাগে না) | ✅ |
| Sumash Tech | product sitemap | Nuxt payload | ✅ |
| Kry International | sitemap | Next.js payload, region সহ | ✅ |
| Dazzle | product sitemap (শুধু সাম্প্রতিক) + ব্র্যান্ডের সাব-ক্যাটাগরি | Next.js payload | ✅ |
| Diamu | WooCommerce sitemap | WooCommerce ভার্সন JSON | ✅ |
| Executive Machines | WooCommerce sitemap | WooCommerce (ভার্সন JSON বা এক দাম) | ✅ |
| MacZen BD | sitemap (`/products/<ক্যাটাগরি>/<পণ্য>`) | Next.js payload: iPhone এ `combinationPrices` (sim + storage), Mac এ `specPriceMap` (প্রসেসর/RAM + স্টোরেজ), নয়তো এক দাম; PRE_ORDER স্টক অজানা, CALL_FOR_PRICE বাদ | ✅ |
| Motion View | sitemap | JSON-LD | ✅ |
| Gadget Breeze | WooCommerce sitemap | WooCommerce | ✅ |
| Shajgoj | product sitemap (`shop.shajgoj.com`) | JSON-LD | ✅ |
| Arogga | product sitemap | JSON-LD | ✅ |
| Chaldal | manual product links | `itemprop="price"` / availability | ✅ |
| স্কিনকেয়ারের বাকি দোকান | manual product links | JSON-LD (WooCommerce/Next.js) | ✅ |
| Lira Import | product sitemap | `wooVariants` (এক দাম) | ✅ |
| eFamas | `product-sitemap.xml` (`/shop/`) | `wooVariants` | ✅ লোকাল; Actions probe বাকি |
| Her Happy Skin | নিজের JSON API (`her-api`) | ওই API-ই (`hhsVariants`) | ✅ |
| Choice Legacy | product sitemap খোলা, কিন্তু পণ্যের পাতায় ~১ অনুরোধ/মিনিট রেট লিমিট | | ⛔ নিয়মে চলে না |
| MK Electronics | `sitemap-products.xml` | JSON-LD | ✅ |
| Othoba | ক্যাটাগরি পাতা (`OTHOBA_CATEGORIES`, `?pagenumber=`), কারণ sitemap ফাঁকা | `othobaVariants`: JSON-LD এর `price` মূল দাম, `sale_price` ছাড়ের দাম | ✅ |
| Beauty Booth | `/sitemap/products.xml` (~৩.৩ MB, তাই `MAX_BODY` ৮ MB) | JSON-LD | ✅ |
| ALZAK, BD Amajan Shop, UK Direct BD, Skin Revive BD | WooCommerce sitemap | `wooVariants` | ✅ |
| Shei Tech | product sitemap (`sitemap_index.xml`) | `wooVariants` + JSON-LD | ✅ |
| Zapatos | `wp-sitemap.xml` (posts-product) | `wooVariants` | ✅ চলে, কিন্তু নিজস্ব ব্র্যান্ডে ক্যাটালগের সাথে ম্যাচ নেই |
| BabyCare | sitemap-এ পণ্য নেই — ক্যাটাগরি পাতা (`?page=`) ঘুরে | `itemprop="price"` (JSON-LD নেই) | ✅ |
| Dolbear | `/sitemap/products.xml` | JSON-LD | ✅ |
| HNS Tech | sitemap নেই — `/shop?page=1..6` ঘুরে | `data-variants` JSON (`hnstechVariants`) | ✅ |
| The Mall BD | | | ⛔ GitHub Actions থেকে robots.txt এ 403 |
| Rokomari | | | ⛔ GitHub Actions থেকে robots.txt এ 403 |
| Pickaboo | `/search-result/<নাম>` HTML | | ⛔ worker কে 403 দেয় |
| Telegram এর দোকান | দোকান নিজে পাঠায় | ⬜ [telegram](15-telegram-bot.md) |
| ক্রেতা | "দাম জানান" | 🟡 [price reports](05-price-reports.md) |

## আসল ডেটা (২০২৬-১০-২১ এ জোগাড়)

৫৩টা টেক পণ্য, ১১৫টা ভার্সন, ১০টা দোকান থেকে ৫৪৫টা দাম, সব পাতায় গিয়ে নিজে দেখা (কোনো দাম আন্দাজ করা নয়)। প্রতিটা পণ্য অন্তত ৩টা দোকানে, শুধু MacBook Pro 14" M5 Max আর Redmi Watch 6 Active ২টায় (নতুন বা দামি, আর কেউ দাম দেয়নি)। পরে চার্জার/ফ্যান/মনিটর/পাওয়ার ব্যাংক আর স্কিনকেয়ার যোগ হয়ে ডেটাবেসে এখন ৯৬টা পণ্য, ৯১১টা দাম, ১৩টা ক্যাটাগরি।

- মোবাইল: Samsung, Xiaomi, Vivo, Realme, Oppo (StatCounter বাংলাদেশ, আগস্ট ২০২৬), প্রতিটার ২-৩টা চলতি মডেল; ২৬ অক্টোবর Honor, Tecno, Infinix, Motorola (নিচে আলাদা অংশ); আর Apple: iPhone 18 Pro/Pro Max, iPhone Duo, 17 Pro/Pro Max, Air, 17, 17e, 16।
- ট্যাবলেট: iPad 11" (A16), iPad mini (A17 Pro), iPad Air 11"/13" M4, iPad Pro 11"/13" M5 (স্টোরেজ আর Wi-Fi/Cellular ধরে ভার্সন)।
- Mac: MacBook Neo, Air 13"/15" M5, Pro 14"/16" (M5, M5 Pro, M5 Max), iMac M4, Mac mini (M6, M5 Pro), Mac Studio M5 Max।
- স্মার্টওয়াচ: Apple Watch Series 11, Galaxy Watch8, Amazfit Active 2 Premium, Huawei Watch Fit 4, Redmi Watch 6 Active।
- অডিও: AirPods Pro 3, Galaxy Buds3 Pro, Sony WF-1000XM6, Soundcore P40i, CMF Buds 2 (ইয়ারবাড); Sony WH-1000XM6, WH-CH720N, JBL Tune 770NC, Soundcore Space One (হেডফোন)।

### স্কিনকেয়ার (২৩ অক্টোবর ২০২৬)

১২টা পণ্য, ১টা করে সাইজ ভার্সন, ১৬টা দোকান থেকে ৪৭টা দাম। নাম, সাইজ, দাম আর স্টক প্রতিটা পাতায় গিয়ে দেখা হয়েছে:

- ক্লিনজার: Simple Refreshing Facial Wash 150ml, CeraVe Hydrating Cleanser 236ml
- ময়েশ্চারাইজার: CeraVe Moisturizing Cream 56ml, Deconstruct Oil-Free Moisturizer 50g
- সিরাম/এসেন্স: The Ordinary Niacinamide 10% + Zinc 1% 30ml, COSRX Advanced Snail 96 Mucin Power Essence 100ml, Dot & Key 10% Vitamin C + E + 5% Niacinamide 30ml, The Derma Co 10% Niacinamide 30ml
- সানস্ক্রিন: Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++ 50ml, Dot & Key Watermelon Cooling Sunscreen SPF50+ PA++++ 80g
- হেয়ার সিরাম: Streax Vitariche Gloss 115ml, Livon Hair Serum 100ml

| দোকান | সাইট | কেন |
|---|---|---|
| Shajgoj | shop.shajgoj.com | সবচেয়ে বড় কসমেটিক্স ক্যাটালগ, JSON-LD-এ দাম/স্টক ঠিক; product sitemap আছে |
| Arogga | arogga.com | ক্লিনজার/সিরাম/স্কিনকেয়ারে প্রতিযোগিতামূলক দাম, JSON-LD |
| Chaldal | chaldal.com | CeraVe-র দাম ভালো, কিন্তু JSON-LD নেই; `itemprop` থেকে দাম পড়া হয়। CeraVe 236ml পেজ এখন OutOfStock |
| BanglaShoppers | banglashoppers.com | Livon/Streax-এ ভালো দাম |
| MedEasy, EmartWay, Beauty Line, Emart, Aromyeo, Korean Care, Skincare Shop, Cosmetics Corner, IndianMartBD, Beprincess, Color World, Glowella | — | ব্র্যান্ডভেদে কম দাম; ম্যানুয়াল লিংক, `prices` generic JSON-LD দিয়ে আপডেট করে |

সিদ্ধান্ত:

- Beauty of Joseon-এ classic Rice + Probiotics 50ml ব্যবহার করা হয়েছে। Shajgoj/Arogga-তে classic 50ml নেই (10ml বা Rice + Niacinamide 50ml আছে), তাই Beauty Line, Emart, Aromyeo, Korean Care থেকে দাম।
- CeraVe Cream-এ 56ml ভার্সন, কিন্তু Arogga-র 57g পেজকে একই ভার্সনে ধরা হয়েছে (56ml ≈ 57g)।
- Streax-এর Shajgoj URL-এ `100ml` লেখা থাকলেও পেজের সাইজ 115ml, তাই 115ml ভার্সনে রাখা হয়েছে।
- ePharma বাদ: JSON-LD-এ MRP/লিস্ট প্রাইস থাকে, discounted দাম নয়; worker ভুল দাম বসাতে পারে।
- Rokomari বাদ: robots.txt search engine ছাড়া অন্য crawler-কে admin@rokomari.com-এ অনুমতি চাইতে বলে; অনুমতি ছাড়া যোগ করা হয়নি।
- Beauty Hub/Shajrup বাদ: নির্ভরযোগ্য JSON-LD/দামের markup নেই বা JS-rendered।

### স্কিনকেয়ার, লিপ-মাস্ক-সানস্ক্রিন-আই কেয়ার (২৫ অক্টোবর ২০২৬)

১৯টা নতুন পণ্য, ২৫টা ভার্সন (সাইজ), ১৬টা দোকান থেকে ২২৫টা দাম। প্রতিটা ভার্সন অন্তত ৪টা দোকানে, বেশিরভাগ ৮-১৫টায়। বাছাই হয়েছে সব দোকানের পুরো তালিকা মিলিয়ে, যাতে শুধু বাইরের ব্র্যান্ডের চলতি পণ্য আসে, যা একাধিক দোকান বেচে। প্রতিটা পাতা worker দিয়ে পড়া (নাম, সাইজ, দাম, কাটা দাম, স্টক, ছবি), `worker:check`-এ সব ঠিক।

- লিপ টিন্ট: Etude Dear Darling Water Tint 9g
- লিপ অয়েল: Beauty Glazed Glazed Glow Lip Oil 4g, Swiss Beauty Dip Tint Lip Oil 3ml
- লিপ বাম/লিপ মাস্ক: Laneige Lip Sleeping Mask Berry (20g, 3g), WishCare Ceramide Lip Balm SPF 50 5g, COSRX Propolis Lip Sleeping Mask 20g
- ফেস মাস্ক: Laneige Water Sleeping Mask (70ml, 15ml), Medicube Collagen Night Wrapping Mask 75ml, Beauty of Joseon Ground Rice and Honey Glow Mask 150ml
- স্ক্রাব: St. Ives Fresh Skin Apricot Scrub 150ml, COSRX Full Fit Honey Sugar Lip Scrub 20g
- প্যাক: Purito Dermide Cica Barrier Sleeping Pack 80ml, Anua Heartleaf Pore Clay Pack 100ml
- সানস্ক্রিন: COSRX Aloe Soothing Sun Cream 50ml, Isntree Hyaluronic Acid Watery Sun Gel (50ml, 10ml), SKIN1004 Hyalu-Cica Water-Fit Sun Serum (50ml, 100ml, 15ml)
- আন্ডার আই: Beauty of Joseon Revive Eye Serum (30ml, 10ml), COSRX Advanced Snail Peptide Eye Cream 25ml, The Ordinary Caffeine Solution 5% + EGCG 30ml

সিদ্ধান্ত:

- এক পণ্যের কয়েকটা সাইজ এক পণ্যের ভার্সন (কঠোর নিয়ম ৯), তাই নামে সাইজ নেই। আগের স্কিনকেয়ার ব্যাচে সাইজ নামের ভেতরে ছিল, সেগুলো বদলানো হয়নি।
- টিন্ট আর লিপ অয়েলের শেড রং, ভার্সন নয়: প্রতি দোকানে স্টকে থাকা সবচেয়ে কম দামের শেডের পাতা নেওয়া।
- অফিসিয়াল দাম = দোকানগুলোর কাটা দামের (MRP) মাঝারি। ৪০%-আড়াই গুণের বাইরের দাম বাদ: সেগুলো ছিল mini/sachet বা সাইজ-না-লেখা পাতা (যেমন Revive Eye Serum 30ml এর ঘরে ৳৪৮০-৬০০ এর mini)।
- Neutrogena Blackhead scrub বাদ: একই নামে Deep Clean 100g, 2% Salicylic 150ml/124ml আর Visibly Clear তিনটা আলাদা পণ্য মিশে আছে (নিয়ম ২)। Mars Love Track Lip Tint বাদ: মাত্র ৪টা দোকান। St. Ives 170g/283g আর COSRX Snail Peptide Eye Cream 5ml ২টার কম দোকানে, বাদ।

নতুন দোকান (worker এ যোগ, robots.txt আর Terms দেখা):

| দোকান | সাইট | listing | দাম |
|---|---|---|---|
| OHSOGO | ohsogo.com | Shopify product sitemap | JSON-LD |
| Chardike | chardike.com | product sitemap | `__NEXT_DATA__` এর initialCoreData (`chardikeVariants`) |
| Perfecto | perfectobd.com | product sitemap | RSC ডেটায় slug ধরে পণ্যের object (`perfectoVariants`) |
| Beprincess BD | beprincessbd.com | WooCommerce sitemap | `wooVariants` (আগে শুধু হাতের লিংক ছিল, এখন worker এ) |
| Korean Mart BD | koreanmartbd.com | product sitemap | JSON-LD |
| Klassy Missy | klassy.com.bd | product sitemap নেই: `manifest/categories.xml` এর ১৬৪টা ক্যাটাগরির প্রথম পাতা (প্রতিটায় ৩৬টা পণ্য, বাকিটা পাতায় JS দিয়ে আসে, তাই সব পণ্য ধরা পড়ে না; একবার আনতে ~৩ মিনিট) | JSON-LD |

- Klassy-র Terms এ "লিখিত অনুমতি ছাড়া সাইটের কোনো অংশ reproduce/copy/exploit নয়" ধারা আছে, Shopify দোকানগুলোর মতোই সাধারণ লেখা; দাম সংগ্রহ আলাদা করে নিষেধ করা নেই। মালিকের সিদ্ধান্তে রাখা।
- Chardike আর Korean Mart BD এর Terms পাতা খালি বা পাওয়া যায়নি; robots.txt খোলা।
- বাদ: The Mall BD (themallbd.com, দ্বিতীয় অনুরোধেই Cloudflare bot challenge), Bio-Xin (bioxin.com, শুধু নিজের পরিবেশনার ব্র্যান্ড বেচে, যা আর কোনো দোকানে নেই)।

### Windows ল্যাপটপ (২৪ অক্টোবর ২০২৬)

৬টা পণ্য, ১১টা ভার্সন, ৪টা দোকান থেকে ১৮টা দাম; গেমিং (Lenovo LOQ 15AHP9 — RTX 3050/4050) আর অফিস (IdeaPad Slim 3 15ABR8/14IRH10, HP 15-fd0180nia, Dell Pro 15 Essential, HP 250R G10) দুই ধরনেরই। প্রতিটা পাতায় গিয়ে CPU/RAM/SSD/দাম মিলিয়ে দেখা, `worker:check`-এ ১৮টাই ঠিক ধরা পড়ে (০ মেলেনি, ০ ব্যর্থ)।

- Binary Logic নতুন দোকান হিসেবে যোগ হলো (binarylogic.com.bd; robots.txt খোলা, OpenCart — Star Tech-এর মতোই পার্স হয়, ২ বছরের অফিসিয়াল ওয়ারেন্টি)।
- HP 15-fd0215dx বাদ: Apple Gadgets আর Sumash একই SKU-তে আলাদা CPU দেখায় (i5-1334U বনাম Core 5 120U) — কোনটা আসল বলা যায় না।
- LOQ 15AHP9 ২টা দোকানে, বাকিগুলো ২-৩টায়; `discover` এখন চালু, সময়ের সাথে আরও দোকান যুক্ত হবে।

কোন দোকান কীসের জন্য ভালো:

| দোকান | সাইট | যে ভাগে | কেন |
|---|---|---|---|
| Star Tech | startech.com.bd | সব | অফিসিয়াল স্টক, পুরো স্পেসিফিকেশন টেবিল, নিয়মিত আর ছাড়ের দাম, স্টক |
| Gadget & Gear | gadgetandgear.com | সব | অফিসিয়াল/অনুমোদিত, প্রতিটা ভার্সনের আলাদা পাতা; Mac এ Apple Authorised |
| Apple Gadgets | applegadgetsbd.com | সব | অফিসিয়াল আর আনঅফিসিয়াল দুই রকম; প্রায়ই সবচেয়ে কম দাম |
| Sumash Tech | sumashtech.com | সব | অফিসিয়াল আর ইন্টারন্যাশনাল আলাদা পাতায়; কাটা দাম অনেক সময় ফোলানো |
| Kry International | kryinternational.com | মোবাইল | আনঅফিসিয়াল ভার্সনে দেশের কোড (India, Global…) |
| Dazzle | dazzle.com.bd | মোবাইল, ঘড়ি, অডিও | বেশিরভাগ আনঅফিসিয়াল, কম দামের রেফারেন্স; MRP ফোলানো |
| MacZen BD | maczenbd.com | Apple (Mac, iPhone, iPad, Watch, AirPods), কিছু Samsung/Surface | Apple-কেন্দ্রিক, Mac এর সব RAM/স্টোরেজ কনফিগারেশন আলাদা দামে; eSIM-only iPhone মানে USA; নিজেদের "MacZen Care" ওয়ারেন্টি, তাই আনঅফিসিয়াল ধরা |
| Diamu | diamu.com.bd | মোবাইল, ঘড়ি, অডিও | আনঅফিসিয়াল, কম কভারেজ |
| Executive Machines | executivemachines.com | Mac | Apple Authorised Reseller, দামি কনফিগও আছে, দাম সাধারণত বেশি |
| Motion View | motionview.com.bd | ঘড়ি, অডিও, পাওয়ার ব্যাংক | Amazfit এর অনুমোদিত পরিবেশক; oraimo পাওয়ার ব্যাংকের অফিসিয়াল রিটেইলার |
| Gadget Breeze | gadgetbreeze.com.bd | ঘড়ি, পাওয়ার ব্যাংক | ছোট দোকান; Redmi Watch 6 Active আর oraimo-র বড় স্টক |
| Three's | threesbd.com | স্নিকার্স | WooCommerce; ১:১ রেপ্লিকা স্নিকার্স, পেজে নিজেরাই ঘোষণা করে |
| Splayd | splayd.com.bd | স্নিকার্স | Shopify; টাইটেলে "1:1" খোলাখুলি |
| Ragen | ragenbd.com | স্নিকার্স | Shopify (উত্তরা); "(1:1) grade"/"OEM" লেখা থাকে |
| DOB Skateshop | dob.com.bd | স্নিকার্স | WooCommerce, crawl-delay 5 মানতে হবে; Q&A-তে "OEM grade replica" |
| Sneaker Zone | sneakerzonebd.com | স্নিকার্স | Shopify; DOB-র সহ-প্রতিষ্ঠান (একই মালিকানা) |
| Trek N Tread | trekntread.com | স্নিকার্স | ২৯ অক্টোবর সাইট নতুন: sitemap আর JSON-LD, সাধারণ `sitemapStore` |
| SneakersBD Official | sneakersbdofficial.com | স্নিকার্স | `product:price:amount` মেটা থেকে দাম পার্স হয় |
| Global Brand | globalbrand.com.bd | চার্জার, মনিটর, ডেস্কটপ | LG/Asus/Lenovo-র ডিস্ট্রিবিউটর (OpenCart); পাতার JSON-LD-তে দাম |
| MC Solution | mcsolution.com.bd | ল্যাপটপ, মনিটর | WooCommerce; অফিসিয়াল ওয়ারেন্টির দোকান |
| PCB Store | pcbstore.com.bd | মনিটর, ডেস্কটপ | গেমিং/PC দোকান (Next.js); পাতার JSON ডেটায় দাম, প্রায়ই Stock out |
| Sell Tech | selltech.com.bd | ডেস্কটপ | OpenCart; brand PC-তে ভালো দাম, JSON-LD |
| Arafa Telecom | arafatelecom.com | মোবাইল, ট্যাবলেট | WooCommerce; এক পাতায় official আর unofficial, প্রতিটা অপশনে লেখা থাকে; কিছু ফোনের আলাদা `-official` পাতা |
| Mobile Buzz BD | mobilebuzzbd.com | মোবাইল, ট্যাবলেট | WooCommerce (যমুনা ফিউচার পার্ক, বসুন্ধরা সিটি); অপশনে কখনো official/int/indian লেখা; কিছু অপশনে বসানো নকল দাম (Edge 70 12/256 = ১০,০০০), সেগুলো বাদ |

বাদ পড়েছে: Pickaboo, GadStyle, Gadget N Music (403 দেয়), Gadget Studio BD (robots.txt এ বন্ধ), Computer Source (timeout), SMS Gadget (Cloudflare challenge), Phone Sell BD (সাইট খোলে না)। Mobile Dokan দোকান না, শুধু অফিসিয়াল দাম মেলাতে দেখা হয়েছে।

### পাওয়ার ব্যাংক (২৪ অক্টোবর ২০২৬)

৮টা পণ্য, ৮টা ভার্সন, ৭টা দোকান থেকে ২৫টা দাম; প্রতিটা পণ্য অন্তত ৩টা দোকানে (ইন-স্টক না থাকলেও দাম-সহ Stock out লিস্টিং দেখানো হয়েছে, `inStock: false`), প্রতিটা পাতায় গিয়ে মডেল-কোড মিলিয়ে দেখা, `worker:check`-এ সব ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- Oraimo Toast OPB-7100Q 10000mAh, PowerNova L11 (OPB-7103C) 10000mAh, PowerNova Q21 (OPB-7200Q) 20000mAh, Slice Link Pro (OPB-P7101) 10000mAh, MagPower 15 (OPB-7102W) 10000mAh ওয়্যারলেস, Baseus Extreme PPJP312 আর Adaman PPADM20S 20000mAh, Anker Zolo A110E (A110EH11) 20000mAh।
- Slice Link Pro-তে Star Tech-এর পাতা "To be announced" (দাম নেই), তাই ওদের লিস্টিং নেই; Sumash-Diamu ইন-স্টক, Motion View Stock out।
- Motion View oraimo-র অফিসিয়াল রিটেইলার (`/tags/oraimo-power-bank` পাতায় মডেল-কোড সহ দাম); Gadget Breeze-এ oraimo-র বড় স্টক; Baseus/Anker-এ Apple Gadgets আর Gadget & Gear।
- DB-র আগের Ugreen PB503/528/568/570 আর Anker Zolo 25000 এখনো ১টা দোকানে; `discover` চালু থাকলে সময়ের সাথে বাড়বে।
- অফিসিয়াল দাম হিসেবে Star Tech-এর Regular price ধরা হয়েছে (Toast ৳১,৫৬৫, L11 ৳২,৩৬৫, Q21 ৳২,২২২, PPJP312 ৳২,৫০৮, A110E ৳৪,৯০০)।

### স্নিকার্স (২৪ অক্টোবর ২০২৬)

২০টা পণ্য (স্নিকার্স + শুজ + রানিং শুজ মিলিয়ে), ৭০টা দাম, ৭টা দোকান; প্রতিটা পণ্য অন্তত ৩টা দোকানে (দাম-সহ Stock out লিস্টিংও গোনা, দামহীন পাতা বাদ), প্রতিটা পাতায় গিয়ে দেখা, `worker:check`-এ ৭০টাই ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- **গুরুত্বপূর্ণ:** BD-র অনলাইন স্নিকার্স মার্কেটের এই অংশটা ইমপোর্টেড ১:১ কপি — দোকানগুলো নিজেরাই পেজে লেখে ("1:1 Replica made in Vietnam", "OEM grade replica")। তাই পণ্যের নামেই "1:1 Copy" রাখা হয়েছে আর condition সব `unofficial`; আসল Nike/Adidas অফিসিয়াল রিটেইল BD অনলাইনে ৩ দোকানে মেলে না (Bata/Apex/Lotto নিজেদের ব্র্যান্ড একচেটিয়া)। অফিসিয়াল দাম = দোকানগুলোর Regular price (৪০%-২৫০% sanity পাস)।
- পণ্য (২০): Air Force 1, Samba OG, Samba Vegan, Onitsuka Tiger Mexico 66 ও Tokuten, Converse Chuck 70 ও Chuck Taylor All Star High, Jordan 1 Low ও Retro High, Jordan 4 Retro, Nike SB Dunk Low, New Balance 9060 ও 530, Puma Speedcat OG, Adidas Gazelle Indoor, Vans Knu Skool, Adidas Adizero Evo SL, Adios Pro Evo 1, Adios Pro 4, Campus 00s।
- নতুন দোকান (এই ধাপে): Trek N Tread (Laravel/Inertia; দাম পাতার embedded data-তে — `"variation_price"`/`"variation_discounted_price"` — worker-এ আলাদা parser), SneakersBD Official (Laravel; `product:price:amount` মেটা থেকে generic og-ফলব্যাক পার্স করে)। আগের ৫: Three's (Woo), Splayd (Shopify), Ragen (Shopify), DOB Skateshop (Woo, crawl-delay 5), Sneaker Zone (Shopify) — সবার robots.txt যাচাই করা। Sneaker Zone আর DOB একই মালিকানার সহ-প্রতিষ্ঠান এবং একই ক্যাটালগ (মিরর); দাম আলাদা হয় বলে দুটোকে আলাদা দোকান হিসেবেই দেখানো হচ্ছে।
- Adios Pro 4-এ Ragen-এর লিস্টিংটা আসলে Y-3 Adios Pro 4 (Adidas-এর Y-3 লাইন) — নোট হিসেবে রাখা হয়েছে।
- বাদ: ERRUM BD (ওয়েবসাইট নেই, শুধু ফেসবুক), Zapatos (নিজেদের ব্র্যান্ড, মডেল মেলে না), Kick'n GO (সাইট নামে না), Bata/Apex/Lotto (একচেটিয়া ব্র্যান্ড); মাত্র ২ দোকানে মেলা মডেলও (Air Max 90/97, Dunk Low, Superstar, Old Skool…) বাদ।

### মনিটর (২৪ অক্টোবর ২০২৬)

মিড-হাই বাজেটের ৬টা নতুন পণ্য (৳২৮,৫০০–৮১,০০০), ১৮টা দাম, ৪টা দোকান; প্রতিটা পণ্য ৩টা দোকানে (দাম-সহ Stock out গোনা হয়েছে, "Call For Price" পাতা বাদ), প্রতিটা পাতায় গিয়ে দেখা, `worker:check`-এ ১৮টাই ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- পণ্য: Asus ProArt PA279CV 27" 4K (Star Tech ৳৬৩,০০০ · PCB Store ৳৬৭,০০০ Stock out · MC Solution ৳৯৫,৫০০), LG 34U650A-B 34" UltraWide (Star Tech ৳৮১,০০০ · PCB ৳৮৪,০০০ Stock out · Global Brand ৳৮৫,০০০), Asus ROG Strix XG27ACMES 27" QHD 255Hz (Star Tech ৳৩৯,৩০০ · PCB ৳৪৬,০০০ SO · Global Brand ৳৪০,০০০ SO), Asus ProArt PA278QGV (Star Tech ৳৪৫,৮০০ · PCB ৳৫০,০০০ SO · GB ৳৪৬,০০০ SO), Asus ProArt PA248QFV Gen2 24.1" (Star Tech ৳৩৩,০০০ · PCB ৳৩৪,৯৯০ SO · GB ৳৩৪,০০০ SO), LG 24U631A-B 23.8" (Star Tech ৳২৮,৫০০ · PCB ৳২৯,২০০ SO · GB ৳৩০,৫০০)।
- নতুন দোকান (এই ধাপে): Global Brand (LG/Asus/Lenovo-র ডিস্ট্রিবিউটর, OpenCart, robots খোলা, অফিসিয়াল), MC Solution (WooCommerce, অফিসিয়াল), PCB Store (গেমিং/PC দোকান, Next.js সাইট; কনফিগ অনুযায়ী আনঅফিসিয়াল)। সবার robots.txt যাচাই করা।
- Global Brand-এর পাতায় sale দেখালেও JSON-LD-তে regular দাম থাকে; worker JSON-LD-ই পড়ে, তাই সেই দামই রাখা হয়েছে (যেমন 34U650A: পাতায় ৳৭১,০০০ sale, JSON-LD/সিঙ্ক ৳৮৫,০০০)।
- বাদ: PCB Store-এ ProArt PA27JCV আর ViewSonic VX3418C-2K "Call For Price" (দাম নেই), ROG Strix XG27ACMEG-এর regular ভার্সন PCB-তে নেই (শুধু Hatsune Miku Edition — আলাদা SKU), GB-তে XG27ACMES-W (সাদা)-র দাম ৳০। এতে ২ দোকানে নেমে যাওয়া মডেলগুলো নেওয়া হয়নি।
- অফিসিয়াল দাম = Star Tech-এর regular price (PA279CV ৳৬৪,০০০, 34U650A ৳৮৫,০০০, XG27ACMES ৳৪৭,০০০, PA278QGV ৳৪৯,০০০, PA248QFV ৳৪৫,০০০, 24U631A ৳২৯,৩০০); সব অফার ৭৩%–১৪৯% — sanity পাস।

### ডেস্কটপ (২৫ অক্টোবর ২০২৬)

মিড-রেঞ্জ আর লো-রেঞ্জের ৫টা জনপ্রিয় Windows ব্র্যান্ড টাওয়ার, ১৭টা ভার্সন, ৬টা দোকান থেকে ২৮টা দাম; প্রতিটা পণ্য ৩-৪টা দোকানে (দাম-সহ Stock out লিস্টিংও গোনা), প্রতিটা পাতায় গিয়ে মডেল-কোড/CPU/RAM/SSD/দাম দেখা, `worker:check`-এ ২৮টাই ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- পণ্য: Dell OptiPlex 7020 MT (৪ দোকান: Sell Tech ৳৬৪,০০০–৯৬,০০০ · Star Tech ৳৭৫,০০০–১,১৫,০০০ · Apple Gadgets ৳৮৪,৫০০–১,১৫,০০০ · Sumash ৳৭৯,৯৯৯), Dell Tower ECT1250 (Sell Tech ৳৬০,০০০/৭৪,০০০ · Star Tech SO · Apple Gadgets), Dell Pro Tower QCT1250 (Apple Gadgets · Sumash · Star Tech Core Ultra 5 ৳১,১০,০০০), HP Pro Tower 280 G9 (Star Tech ৳১,০২,০০০–১,৩৭,০০০ · Global Brand SO ৳১,১০,০০০ · PCB Store SO ৳৪৭,০০০), Lenovo IdeaCentre 08IRH9 (Star Tech ৳৯৭,৫০০ · Global Brand ৳৯৭,৫০০ · PCB Store SO ৳৯০,৭৫০)।
- **৫+ দোকানে কোনো ডেস্কটপ মেলেনি** — সর্বোচ্চ OptiPlex 7020-এ ৪টা; বাজারে একই ব্র্যান্ড PC মডেল এত দোকানে থাকে না। তাই কঠোর নিয়মের ন্যূনতম ৩ দোকান শর্তেই নেওয়া হয়েছে।
- বাদ: Dell QVT1260, ThinkCentre neo 50t Gen5/Gen6, IdeaCentre Mini 01IRH10R, IdeaCentre AIO 24IRH9, Dell EC24250 AIO, HP 24-cr AIO, Acer Veriton M4690G/S2690G — সব ২ দোকানে; Apple Gadgets/Sell Tech-এর কাস্টম বিল্ড (মডেল কোড নেই); MC Solution-এর "Call for Price"; Sumash ECT1250 TBA; Global Brand-এর monitor-বান্ডেল SKU ও দামহীন পাতা; HP 290 G9 ও 400 G9 (Apple Gadgets ছাড়া কেউ নেই)।
- অফিসিয়াল দাম = অফিসিয়াল চ্যানেলের (Star Tech/Global Brand/Sell Tech) চলতি দাম; শুধু OptiPlex-এর Core i5-13500-এর অ্যাংকর ৳৮৫,০০০ আন্তঃসীমায়িত (ও ভার্সনে শুধু আনঅফিসিয়াল Sumash-এর দাম আছে)। Star Tech-র ECT1250 i5-14400 SO দাম ৳১,০৫,০০০ বাজারের বাইরে হলেও sanity পাস (১৪২%)।
- নতুন ক্যাটাগরি লাগেনি: DB-র `desktop`-এ iMac/Mac mini/Mac Studio আগে থেকেই ছিল; worker-এ Star Tech discover-এ `/desktops/brand-pc` যোগ হয়েছে। Sell Tech আগে থেকেই worker-এ ছিল, ডেস্কটপের দাম এবারই প্রথম।

### ডেস্কটপ যোগ ২ (২৬ অক্টোবর ২০২৬)

আরও ৫টা চাওয়া হলেও ৩+ দোকানের কঠোর নিয়মে বাজারে আর মাত্র ২টা পণ্য মেলে — ২টাই যোগ হলো, ৫টা ভার্সন, ৬টা দাম; দাম যাচাই ২৫ অক্টোবর রাতে, `worker:check`-এ সব ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- Dell **Pro Slim QCS1250** (৩ দোকান): Star Tech 16GB/512GB ৳১,১২,০০০ (ক্যাশ দাম, regular ৳১,৩২,০০০, In Stock) · Sell Tech 8GB/512GB ৳৯১,৫০০ (In Stock) · Apple Gadgets 8GB/512GB ৳১,১৬,৫০০ (আনঅফিসিয়াল)। একই মডেল দুই RAM-ভার্সনে।
- ASUS **ExpertCenter AiO P440VAK** (৩ দোকান, সবাই 16GB/1TB ২৩.৮″): Star Tech Core 7 240H ৳১,৫২,০০০ (MPN P440VAK-BPCD780, In Stock) · Global Brand Core 5 210H ৳১,২১,০০০ (BPCD710, Stock out) · Sell Tech Core i5-13420H ৳৯৪,০০০ (regular ৳৯৯,০০০)।
- **৩+ দোকানে আর কোনো ডেস্কটপ নেই** — বাকি প্রার্থী সবাই ২ দোকানে সীমাবদ্ধ: Dell EC24250 AIO ও Inspiron 5430 AIO (ST+Sell Tech), IdeaCentre AIO 24ILL11/27ILL11 ও 08IRR9 ও ThinkCentre neo 50t (ST+GB), Value-Top AIO (Sell Tech + ST-র সব SO), HP 24-cr (AG+ST), ASUS P440VAT/P470VAK/PM640KA (ST+GB), GB-র D700MC/D900SA (GB+PCB SO), OptiPlex 7010 ও Veriton M4690G (Sell Tech+PCB SO), MSI BZ09/PRO DP180 (আলাদা মডেল)। Lenovo 24IRH9 GB-র ৩ পাতাতেই দাম নেই; mini PC (ASUS NUC/ROG) ST+MC Solution-এ, MC-র দাম ০/Call for Price।
- GB-র HP 280 G9 i7 (B7NZ1PT) পাতায় ৳১,১০,০০০ দেখালেও পাতায় worker-এর পড়ার মতো price-element নেই — না-মেলা অফার রাখা যায় না বলে বাদ; i5-ভার্সনের GB অফার ব্যাচ ১-এই আছে।
- অফিসিয়াল দাম = ভার্সনপ্রতি অফিসিয়াল চ্যানেলের দাম (ST regular ৳১,৩২,০০০/৳১,৬৪,৯২০; GB ৳১,২১,০০০; Sell Tech regular ৳৯৯,০০০; 8GB QCS-এর অ্যাংকর AG-র ৳১,১৬,৫০০) — সব অফার ৭৯%–১০০%, sanity পাস। releaseYear দুটোই ২০২৫ (Dell Pro রিব্র্যান্ড, ASUS Core 200H)।

### চার্জার আর চার্জার ফ্যান (২৫ অক্টোবর ২০২৬)

লো থেকে মিড-রেঞ্জের ৫টা চার্জার (৳৬৩০–৩,৫৯০) আর ৯টা চার্জার ফ্যান (৳১,০৬০–৩,৫৯০), ১৪টা ভার্সন, ৮টা দোকান থেকে ৭০টা দাম (`data/catalog/charger.json`, `fan.json`)। এবারের শর্ত কড়া ছিল: **প্রতিটা পণ্য অন্তত ৪টা দোকানে** (দাম-সহ Stock out/Pre-order লিস্টিংও গোনা)। প্রার্থী বের করা হয়েছে Star Tech-এর `/mobile-phone-charger-adapter` আর `/charger-fan` পেজ + ১৫টা দোকানের product sitemap মিলিয়ে, তারপর প্রতিটা পাতা worker-এর নিজের parser দিয়ে পড়ে দাম/স্টক/ছবি আর আলাদা করে HTML-এ মডেল-কোড খোঁজা। `worker:check`-এ ৭০টাই ঠিক (০ মেলেনি, ০ ব্যর্থ)।

- চার্জার (সব Anker, মডেল-কোড প্রতিটা পাতায় মিলিয়ে): Zolo 20W **A2699** (Gadget Breeze ৳৬৩০ · Kry ৳৮৯৯ · Star Tech ৳৯২০ · Gadget & Gear ৳১,০৯৯ 3-pin), Zolo 30W **A2698** (৬ দোকান ৳৮২০–১,১৯৯), Nano 45W **A2692** (৫ দোকান ৳১,৫২০–২,১৯৯), Nano 45W Smart Display **A121D** (৬ দোকান, ৭ দাম; China ভার্সন Star Tech ৳২,৫৯৯ / Gadget & Gear ৳২,৭৯০, Global ভার্সন Star Tech ৳৩,২০৩ / Gadget Breeze ৳২,৯৫০ / Motion View ৳৩,৫৯০ — অফারের `region`-এ China/Global), 25W Compact **A2656** (Star Tech ৳৯৪৬ · Gadget Breeze ৳৯৯০ · Kry ৳১,২৯৯ · Motion View SO ৳১,২৯৯)।
- ফ্যান (মডেল নামেই): Jisulife Life1 FA26 (৫ দোকান ৳১,৭৯০–২,০৫০), Jisulife FA19 (৪, ৳১,৯৯০–২,৬০০; Star Tech ছাড়া সব SO), Xiaomi Solove F5 (৭, ৳১,৯৫০–২,৭৯৯), Solove F5 Pro = F5P (৭, ৳২,৪৫০–৩,৪৯৯), Solove F5 Pro Max 10000mAh (৪, ৳৩,২৯৯–৩,৫৯০), Solove F3 (৫, ৳১,৪৫০–১,৫০০; Star Tech/Motion View/Apple Gadgets SO), Hoco HX65 (৪, ৳১,০৬০–১,৩৫০), Hoco HX66 (৪, ৳১,৮৪০–২,৫০০), WiWU FS03 (৪, ৳১,২১৫–১,৬০০)।
- দোকানের বিশেষত্ব: Apple Gadgets-এর কিছু পাতায় দাম থাকলেও "Pre-order" — `inStock: false`; ওয়ারেন্টি অপশন আলাদা দামে হলে (Apple Gadgets N/A/3/6 Months, Gadget Breeze 15 days/18 months) স্টকে থাকা সবচেয়ে কম দামটা। Star Tech-এর Zolo 20W/30W, 25W আর Solove F3 পাতায় স্পেক-টেবিল নেই (শুধু বুলেট), তাই `specs.json`-এ ওই ৪টা ফাঁকা; MPN বুলেটেই আছে (`A2699J11`)।
- অফিসিয়াল দাম = Star Tech-এর কাটা (regular) দাম, মনিটরের মতোই; A121D-তে China ভার্সনের ৳২,৭৯৯। `releaseYear` ব্র্যান্ডের ঘোষণার বছর থেকে (Zolo/Nano A2692 ২০২৪, A121D ২০২৫, FA26 ২০২২, FA19 ও Solove F5/F3 ২০২১, F5 Pro ২০২৩, F5 Pro Max ২০২৪, HX65/HX66 ২০২৫, FS03 ২০২৩) — দোকানে প্রথম ওঠার তারিখ (Diamu-র upload path) এর সাথে মেলে।
- **মডেল-কোড নিয়মে (নিয়ম ২) বাদ:** Samsung 25W PD — Star Tech-এর পাতা EP-TA2510, বাকি ৬ দোকানের কোনো পাতায় EP কোড নেই; Xiaomi 20W — Sumash/Motion View AD201, Kry MDY-20-EG, Star Tech কোডহীন; Xiaomi 33W/67W — Star Tech-এ SO বা কার-চার্জার পাতা, কোড অনিশ্চিত; Ugreen CD318/CD319 — একই মডেলের প্লাগ/রং ভেদে ৩–৬টা SKU (#15324/#15328/#90664/#90902…), দোকানভেদে আলাদা, মেলানো যায় না; Baseus Super Si 20W — শুধু Star Tech আর Apple Gadgets-এ একক চার্জার, Kry/Diamu-র পাতা কেবল-বান্ডেল। Zolo 20W-এ Apple Gadgets/Sumash (কোড নেই) আর Diamu/Motion View (পাতায় Model A2615, Motion View-এর sku আবার A2699J11 — দ্বিধা) বাদ।
- **৪ দোকান না হওয়ায় বাদ:** Jisulife FA13R (৩, Star Tech-এ দাম নেই), Oraimo PowerCube 20/PowerGaN 351 (Star Tech + Sumash), Anker Zolo 1C/Nano II (আলাদা মডেল, ১–২ দোকান)। Jisulife FA13P (৫ দোকান কিন্তু ৳৪,৫০০+, ৪টাই SO) আর Table Fan Pro3 (৳১১,৯০০) লো-মিড নয়। Apple 20W ইচ্ছে করে বাদ — A2246 বনাম A2347 আর কপি-মার্কেট ঝুঁকি।
- কোডে: DB-তে `wattage` অক্ষ আগেই migration-এ ছিল, অ্যাপ জানত না — `src/types/catalog.ts` AXES, `bn/en` লেবেল (ওয়াট/Wattage), `parseVariantLabel` (`20W`), `sortAxisValues`/alternatives-এ সংখ্যা-ক্রম, আর `scripts/import-catalog.mjs`-এর AXES + `DEFAULT_CATEGORY` (`charger`, `fan`) যোগ হয়েছে। ফ্যানের অক্ষ `size`, কিন্তু কোনো মডেলে সাইজভেদে দাম আলাদা নয়, তাই সব `Standard`। Star Tech discover-এ দুই ক্যাটাগরির path আগে থেকেই ছিল।
- DB-তে আগে থেকে admin দিয়ে ঢোকানো চার্জার/ফ্যান (Ugreen X517/CD359/X860/CD333, Anker B121B, Oraimo HyperGaN 701, Hoco HX607/HX608, Solove F12, Aecooly TH01, WARMAC 107, Xundd XDOT-063) এর কোনোটার সাথে মিল নেই, ডুপ্লিকেট হয়নি।

### ল্যাপটপ: ProBook 460 G11 আর ThinkPad E14 (২৫ অক্টোবর ২০২৬)

৩টা পণ্য, ১১টা ভার্সন, ৬ দোকান থেকে ১৮টা দাম (`laptop.json`); প্রতিটা পাতায় CPU/RAM/SSD আর HP MPN / Lenovo part number মিলিয়ে, `worker:check`-এ ১৮টাই ঠিক (০ মেলেনি)। শুরুতে মনে হয়েছিল "CPU/RAM configuration এক নয়" বলে এগুলো যোগ করা যাবে না — আসলে নিয়ম ৩ পণ্য-স্তরে (পণ্যটা ৩ দোকানে), আর আলাদা config = আলাদা ভার্সন (IdeaPad Slim 3 15ABR8-এর মতো); নিয়ম ২ শুধু বলে এক ভার্সনের সব অফারের কোড এক হতে হবে।

- **HP ProBook 460 G11** — একই নামে দুই SKU-লাইন: H-সিরিজ (Star Tech + Sell Tech, দুটোতেই একই MPN: **B7PE3PT** = Core Ultra 5 125H 8GB/512GB ৳১,১৭,০০০/১,২৪,৮০০; **B7PE4PT** = Ultra 7 155H 8GB/512GB ৳১,৪২,০০০/১,৪৯,০০০) আর U-সিরিজ (Apple Gadgets + Sumash: Ultra 5 125U 8GB/512GB দুটোতেই ৳৯৯,৯৯৯; Ultra 7 155U 16GB/512GB ৳১,৪২,৯০০/১,২৪,৯৯৯, Sumash-এ HP code A38BHET)। ৪ ভার্সন, প্রতিটা ২ দোকানে, পণ্য ৪ দোকানে। U-সিরিজে অফিসিয়াল চ্যানেল নেই, অ্যাংকর = দোকানের regular দাম (৯৯,৯৯৯; AG-র কাটা ১,৫২,০০০)। Sumash-এর 125U পাতার URL-এ "16gb" থাকলেও শিরোনাম আর Memory সারি 8GB, দামও AG-র 8GB-র সমান — 8GB ধরা।
- **Lenovo ThinkPad E14 Gen 7** — part number ধরে: **21SXS0N300** (Ultra 5 225U 8GB/512GB) Star Tech ৳১,১৬,৫০০ + Global Brand ৳১,১৬,৫০০ (SO); **21SXS0MU00** (225U 16GB) Global Brand ৳১,২৮,৫০০; **21SXS0HA00** (225H 16GB) Star Tech ৳১,৩৯,৫০০; **21SXS0N500** (Ultra 7 255H 16GB) Star Tech ৳১,৮০,০০০ + Apple Gadgets ৳১,৬২,০০০। ৩ দোকান।
- **Lenovo ThinkPad E14 Gen 6** — **21M7S0NK00** (Ultra 5 125U 8GB/512GB) Sell Tech ৳১,০৭,০০০ (Star Tech-এ একই part কিন্তু "To be announced", তাই শুধু specsSource); Ultra 5 125H 16GB Apple Gadgets ৳১,২১,০০০; Ultra 7 155H 16GB Apple Gadgets ৳১,৪৯,০০০ + Dazzle ৳১,৫৯,৯৯০। ৩ দোকান (Sell Tech, Apple Gadgets, Dazzle)। Sell Tech-এর 125H/155U আর Global Brand-এর 125H/Ryzen 5 পাতায় দাম নেই — বাদ।
- **ThinkPad L14 Gen 6 যোগ করা যায়নি:** Intel (part 21S7S36800, Ultra 5 225U 16GB/512GB) Star Tech ৳১,৩৫,৫০০ আছে, Global Brand-এর একই-part পাতায় দাম ০.০০/OutOfStock (অফার নয়), MC Solution-এরটা AMD Ryzen 7 PRO 250 CTO (21S8CTO1WW) — দাম-সহ দোকান ২টা। Binary Logic-এ নেই।
- **ThinkPad X1 Carbon Gen 12/13 যোগ করা যায়নি:** Star Tech-এর দুই পাতাই "To be announced / Out Of Stock"; Apple Gadgets-এ দামহীন "Pre Order" বোতাম; Global Brand Gen 13 (21NXS0N800, Ultra 7 255H) দাম ০.০০। দাম-সহ শুধু Dazzle (Gen 12 155U 16GB/2TB ৳২,২০,০৯০; Gen 13 Aura 258V 32GB/1TB ৳২,৮৪,৪৯০) আর MC Solution (Gen 12 165U 64GB/1TB 21KC009VMY ৳৩,১৫,০০০; Gen 13 Aura 258V 32GB/1TB ৳৩,৯৮,৯০০) — ২ দোকান, config-ও ভিন্ন। Star Tech দাম দিলে (Gen 13-এর part ওদের ও Global Brand-এ এক: 21NXS0N800) আবার দেখা যাবে। নতুন দোকান যোগ করলেও part/দাম না মিললে লাভ নেই — এটা ঠিকই ধরা হয়েছিল।
- **Apple Gadgets-এর স্টক লেবেল:** "Availability: in stock" আর "online order" দুটোতেই Add To Cart চালু, মানে কেনা যায় — `inStock: true`। আসল pre-order হলে দাম থাকে না আর বোতামে "Pre Order" লেখা (X1 Carbon)। চার্জার ফ্যানের ৪টা AG অফার (FA26, HX65, HX66, FS03) আগে ভুলে `false` ছিল, `fan.json`-এ `true` করা হয়েছে; DB-তে ২৫ অক্টোবরের seed-এ `false` গেছে, পরের `prices` run-এ AG parser-এর মান বসবে।
- **worker-এর একটা দুর্বলতা (ঠিক করা হয়নি):** Star Tech-এর "To be announced" পাতায় parser দাম পায় — SEO বর্ণনার "…price in Bangladesh is 107,000৳" বাক্য থেকে (E14 Gen 6-এ ১,০৭,০০০, X1 Carbon-এ ৩,৫০,০০০/৩,৭০,০০০) — আর `inStock: false` দেয়। অর্থাৎ TBA পণ্যে পুরনো দাম "Stock out" হিসেবে সিঙ্ক হতে পারে। Star Tech parser-এ "To be announced" দেখলে দাম বাদ দেওয়া উচিত।
- **Binary Logic `workers/stores/index.ts`-এ নেই:** ২৪ অক্টোবরের নোটে "worker-এ যোগ হলো" লেখা থাকলেও entry নেই (HEAD আর working tree দুটোতেই); `laptop.json`-এর Binary Logic দামগুলো এখন `genericStore` (JSON-LD) দিয়ে পড়া হয়। দোকান-নিয়ম ৫ মতে entry যোগ করা বাকি।

### স্কিনকেয়ারে নতুন দোকান (২৫ অক্টোবর ২০২৬)

Lira Import আর Her Happy Skin যোগ হলো (robots.txt আর Terms দেখা); বর্তমান স্কিনকেয়ার পণ্যগুলোর সাথে মিলিয়ে ৪১টা নতুন দাম (Lira ১৬, Her Happy Skin ২৫), প্রতিটা পাতা নিজে পড়ে নাম/সাইজ/দাম/স্টক যাচাই, `worker:check`-এ সব ঠিক (০ মেলেনি)।

| দোকান | সাইট | listing | দাম |
|---|---|---|---|
| Lira Import | liraimportltd.com | Rank Math product sitemap (`product-sitemap*.xml`, ~২,৫০০ পণ্য) | `wooVariants` (সবগুলোই product-type-simple: `<p class="price">` + instock class) |
| Her Happy Skin | herhappyskin.com | সাইটম্যাপ নেই, পাতাও JS-এ ফাঁকা; সাইট নিজে `her-api.herhappyskin.com/hst-api` থেকে পড়ে — তালিকা `products/?name=&page=N` (৩৪৪ পণ্য), দাম-স্টক `product-details/<slug>/1453456` (`hhsVariants`) | ওই API-ই |

- Her Happy Skin-এর API টা Django REST: `Accept: text/html` গেলে browsable HTML দেয়, তাই worker-এ `getText`-এর পাশে `getJson` (Accept: application/json) যোগ হয়েছে। robots.txt নেই (৪০৪), Terms লিংক মৃত — Chardike-র মতো কেস।
- Lira Import-এ CeraVe/Cetaphil/COSRX-এর স্টক ভালো; ২৩৬/২৩৭ml একই ভার্সন ধরা হয়েছে (Arogga-র ৫৬ml≈৫৭g-এর মতো)। Beauty Glazed Glow Lip Oil #104 Love (শেড ভেদ), WishCare Natural স্টক নেই (`inStock: false`)।
- ম্যাপ করতে গিয়ে বাদ: Lira-র Simple "Refresh Facial Wash Gel" পাতায় সাইজ নেই (নিয়ম ২); Her Happy Skin-এ Relief Sun শুধু ১০ml (Aqua-fresh আলাদা পণ্য), COSRX Snail Peptide Eye Cream শুধু ৫ml।
- **খেয়াল (২৫ অক্টোবর):** একই রকম কড়া 429 ওই দিন OHSOGO, Ragen, Sneaker Zone আর Splayd-ও (সবই Shopify) দিচ্ছিল — আগের ব্যাচে যাদের `worker:check` পাস করেছিল। বালতি ঠান্ডা হলে এরা আবার পাস করে; কিন্তু Shopify-র দিক থেকে দিন দিন কড়া হচ্ছে বলে সাময়িকভাবে এই দোকানগুলোর কিছু পাতা "দোকান আটকে রাখায় বাদ" হতে পারে।

**Choice Legacy (choicelegacy.com.bd) বাদ:** Shopify দোকান, robots.txt খোলা, নিজেদের `agents.md`-এ পণ্যের পাতা পড়ার অনুমতি আছে (`/products/<handle>`, 429 এলে Retry-After মানতে বলে)। কিন্তু পণ্যের পাতায় (HTML আর `.js` দুটোতেই) রেট লিমিট এত কড়া যে ১২ সেকেন্ড ফাঁকেও ধারাবাহিক 429 (Retry-After 60) — মোটামুটি ১ অনুরোধ/মিনিট। আমাদের ~২৯টা ম্যাপ-হওয়া URL-এ প্রতি `prices` run-এ ~১ ঘণ্টা লাগত, আর worker-এর নিয়মে 429 মানেই দোকান-ব্লক + প্রতিটা পাতা AI দিয়ে পড়া — চলে না। ওদের "Relief Sun : Rice + Niacinamide" পাতাও আমাদের Rice + Probiotics পণ্যের নয়। মালিক চাইলে দোকানের কাছে feed/UCP (`/api/ucp/mcp`) চেয়ে আবার দেখা যাবে।

### কীভাবে ঢোকানো হলো

1. `data/catalog/{mobile,apple,mac,watch,audio}.json`: জোগাড় করা কাঁচা ডেটা (দোকান, পাতার লিংক, দাম, স্টক, অফিসিয়াল/আনঅফিসিয়াল, তারিখ)।
2. `npm run catalog:specs`: Star Tech এর পাতা থেকে স্পেসিফিকেশন টেবিল `data/catalog/specs.json` এ (সেকেন্ডে একটা অনুরোধ, সৎ UA)।
3. `npm run catalog:build`: `src/data/catalog.generated.ts` (Supabase ছাড়া চালালে সাইট এটা দেখায়) আর `supabase/seed.sql` (Supabase এ migration এর পরে একবার চালান) বানায়।

দামের ইতিহাস বানানো হয়নি; শুধু আজকের দাম আছে, তাই চার্ট কয়েক দিন দাম জমার পরে দেখাবে। নমুনা অফার (কার্ড/bKash) সরানো হয়েছে কারণ সেগুলো আসল ছিল না।

### স্পেক ব্যাকফিল (২৪ অক্টোবর ২০২৬)

১১০টা পণ্যে স্পেক খালি ছিল। যাচাই করে ৫৮টাতে স্পেক ভরা হলো (ডিবিতে সরাসরি UPDATE — seed insert-only, পুরনো রো আপডেট করে না):

- **উৎস:** পণ্য নিজেই Star Tech-এ বিক্রি হলে তার অফার URL-ই স্পেক পাতা (৪৭টা); Motion View ৪টা (মনিটর), AppleGadgets ২টা (LOQ 15AHP9, HP 15 fd0180nia — `fetch-specs.mjs` এদের পার্স করে না, হাতে `specs.json`-এ ঢোকানো), MobileDokan ১টা (iPhone 16, `aps-specs-table` ফরম্যাট)। সব পাতার টাইটেল + স্পেক-ভ্যালু দিয়ে মিল যাচাই করা (যেমন Haylou Watch 4-এর স্পেকেই GPS লেখা, Redmi Monitor 27-এ "Maximum Refresh Rate: 75 Hz")।
- **রিপোর দিক:** watch.json-এর ২১টা ঘড়িতে `specsSource` যোগ হয়েছে; `catalog:specs` → `catalog:build` → ডিবি UPDATE।
- **এখনো স্পেক-শূন্য ৫২টা:** স্কিনকেয়ার ২৯ আর স্নিকার্স ২০ (এই ক্যাটাগরিতে স্পেক-টেবিলই নেই), MacBook Pro 14 M5 Max (Star Tech-এ শুধু 16″ M5 Max আছে, ভুল সাইজের স্পেক দেওয়া যাবে না), Anker Zolo 25000mAh (Star Tech-এ নেই), realme 14 5G (realme.com-এর পাতা JS-নির্ভর, পার্স হয় না)।
- **খেয়াল:** ডিবিতে ২৯টা পণ্য (চার্জার ৬, ফ্যান ৬, ইয়ারবাডস ৫, পাওয়ারব্যাংক ৫, মনিটর ৬, iPhone 16, Redmi Watch 6 Lite, WEOFly ২) আছে যাদের `data/catalog/*.json`-এ কোনো এন্ট্রি নেই — সেগুলো আগে সরাসরি ডিবিতে ঢোকানো হয়েছিল। ক্যাটালগ ফাইলই একমাত্র উৎস, তাই এদের পরে একটা ব্যাচ ফাইলে ফেরানো উচিত।

### মধু আর খেজুর (২৬ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `honey` আর `dates` (migration `20261026140000_honey-dates-categories.sql`, ভার্সনের ঘর `capacity` = ওজন, কলাম `quality_note`)। ১৯টা পণ্য (মধু ১৩, খেজুর ৬), ৯৬টা দাম, প্রতিটা ২+ দোকানে। দোকান: Arogga, Chaldal, Othoba, আর নতুন Rokomari। প্রতিটা পাতা worker parser দিয়ে লাইভ পড়া, `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*।

- **মধু, ব্র্যান্ড ধরে:** Dabur, Saffola, Hamdard, Al Shifa (Natural, Acacia, Black Forest), Hosen, Karkuma, Modern Herbal কালোজিরা, Farmer's Gold কালোজিরা, Ashol (সুন্দরবন, কালোজিরা, লিচু)। ক্যাটাগরিতে "আসল যাচাইয়ের নোট" চালু।
- **খেজুর, জাত আর ওজন ধরে (মালিকের সিদ্ধান্ত):** আজওয়া, মরিয়ম/মাবরুম, সাফাভি/কালমি, সুক্কারি, মেডজুল (ব্র্যান্ডের ঘরে জাত); আর ব্র্যান্ডের Rongdhonu খুরমা। এখানে "মডেল কোড মিলতে হবে" নিয়মের ব্যতিক্রম — দোকানভেদে আমদানিকারক আর মান আলাদা, তাই পণ্যের পাতায় `quality_note` ("দোকানভেদে মান, আকার আর উৎস আলাদা হতে পারে")। Othoba মার্কেটপ্লেসে একই জাত-ওজনে কয়েকজন বিক্রেতা থাকলে স্টকে থাকা সবচেয়ে কম দামটা।
- `officialPrice`: খাবারে নির্ধারিত দাম নেই, তাই প্রতি ওজনে দোকানগুলোর দামের মাঝামাঝি — শুধু ৪০%-২৫০% sanity-র জন্য।
- **বাদ:** Shwapno (২৭ অক্টোবর আবার দেখা: এখন দাম HTML-এই আছে, কিন্তু `/tac`-এর 11.5 আর 11.6-এ automated system আর scrape নিষেধ, তাই স্থায়ীভাবে বাদ), Naturo সাধারণ worker-এ নয় (`naturobd.com`, robots.txt-এও Vercel Security Checkpoint 429; strict-rules অনুযায়ী special-stores দিয়ে), Khaas Food (দাম JavaScript দিয়ে আসে), Meena Bazar (পুরো SPA), Ghorer Bazar (Cloudflare challenge, worker-এর পরিচয়ে বাসার PC থেকেও 403), ePharma (JSON-LD-এ MRP, ছাড়ের দাম নয়), Unimart (sitemap-এ পণ্য নেই)। Othoba-র একটা "Saffola 250g" লিংক আসলে Dabur Squeezy-র পাতা, আর Al Shifa-র ml লিস্টিং — বাদ।
- **খেয়াল:** Chaldal-এর পাতা ভারী (~১.৭MB, ২০-৫০ সেকেন্ড), আর চাপে থাকলে আসল পাতাতেও মাঝে মাঝে 404 দেয়। তাই worker-এ পাতা পড়ার সময়সীমা ৩০ থেকে ৬০ সেকেন্ড, আর 404 পেলে ৩ সেকেন্ড থেমে একবার আবার দেখে — নইলে ভুল করে "স্টকে নেই" হয়ে যেত। এরপর Chaldal-এর ১২টা দামই `worker:check` পাস।
- **শেষ যাচাই:** মধু, খেজুর, রাউটার, নেকব্যান্ড/অডিওর ৪০৩টা লিংক আলাদা খুলে দেখা (HTTP, redirect, শিরোনামে মডেল/জাত/ওজন/প্যাক); ৮২টা পণ্যের সব ছবি ব্রাউজারে খোলে, পাশাপাশি সাজিয়ে চোখে মিলানো। Tenda TX12 Pro-র একই ছবি দুবার ছিল, Oraimo Necklace 5 আর Realme 5 Lite-এর বিজ্ঞাপনের ছবি প্রথমে ছিল — ঠিক করা।
- worker: Othoba-র discover-এ `/honey` আর `/dates`।

### মধু আর খেজুর, আরও খোঁজা (২৮ অক্টোবর ২০২৬)

মধুতে ৮টা নতুন পণ্য (১৩ → ২১), দাম ৬২ → ৯৬; খেজুরে নতুন জাত নয়, ৩টা জাতে 250g আর একটা দাম যোগ (৩৪ → ৪১)। প্রতিটা নতুন পণ্য ২টা আলাদা দোকানে, ওজন হুবহু মিলিয়ে। `worker:check` মধু আর খেজুরে ০ মেলেনি (Chaldal মাঝে মাঝে 404 দেয়, আবার চালালে ঠিক), সব ছবি ২০০ image/*। কোডে বদল নেই।

- **নতুন মধু:** ACI Pure Multifloral 250g (Arogga, Chaldal), Dabur Sundarbans 500g (Arogga, Chaldal), Ashol Mustard Flower আর Ashol Sundarban Flower 250g/500g (Arogga, Rokomari; Arogga-র শিরোনামে ওজন নেই, ছবির ফাইলনাম আর "Pack Size" থেকে মেলানো), Acure Mixed Flower 250g/500g (Rokomari-র "Acure Honey (Modhu)"-এর পাতায় Honey Type: Mix Flower), Khaas Food Black Seed 250g/500g/1kg (Arogga; 500g Chaldal-এও, স্টকে নেই), Shefa'a Natural Honey 500g (Chaldal, Othoba), American Gourmet Honey 500g স্কুইজ বোতল (Arogga স্টকে নেই, Othoba; কাচের জার আলাদা পণ্য বলে বাদ)।
- **আগের পণ্যে দাম/ভার্সন:** Dabur 100g আর 500g আর Saffola 100g আর 250g-এ Chaldal; Al Shifa Natural 500g-এ Chaldal ("Natural Floral" নামে, ছবিতে একই বোতল) আর 1kg-এ Rokomari; Al Shifa Black Forest 250g-এ Chaldal; Karkuma 400g-এ MedEasy আর নতুন 300g ভার্সন (Arogga, MedEasy)। খেজুরে আজওয়া, মরিয়ম আর মেডজুলে 250g (Arogga-র Farmer's Gold, Othoba), মেডজুল 1kg-এ Chaldal।
- **খোঁজা হলো, নেওয়া হলো না:** PRAN Honey (শুধু Othoba-য়), Dabbas, Zahidi, Farida, Sagai, চড়া (তিউনিসিয়া/আলজেরিয়া) খেজুর (শুধু Othoba-র বিক্রেতারা, দ্বিতীয় দোকান নেই), Allah Shafi (Chaldal-এ 500g, Othoba-য় শুধু 1kg), Farmer's Gold লিচু/সরিষা (Arogga-য় ml বা ওজন লেখা নেই), Green Harvest (Arogga 600g, Rokomari 150/300/500g)। Rokomari-তে ক্যাটাগরির দ্বিতীয় পাতা (`?page=`) robots-এ বন্ধ, তাই শুধু প্রথম পাতা থেকে লিংক।
- **নতুন দোকান যাচাই:** MedEasy আগেই generic ভাবে পড়া হয় (sitemap-এ মধু শুধু Karkuma), তাই শুধু অফার যোগ। বাদ: Sindabad (robots খোলা, sitemap-এ Dabur/Al Shifa/খেজুর আছে, কিন্তু পাতা SPA, HTML-এ দাম নেই), Lazz Pharma (sitemap-এ অনেক মধু, কিন্তু Next.js পাতায় দাম JavaScript দিয়ে আসে; তার ওপর মার্কেটপ্লেস), Daily Shopping (`dailyshoppingbd.com` এখন Othoba-তে redirect), BanglaShoppers (Magento, robots খোলা, কিন্তু মধু/খেজুর বলতে শুধু আমদানি করা Manuka/Tesco, মেলানোর মতো কিছু নেই), e-mart (শুধু স্কিনকেয়ার), Osudpotro (sitemap নেই)।

### ল্যাপটপে ASUS, HP, Dell, MSI (২৯ অক্টোবর ২০২৬)

ল্যাপটপে ২০টা নতুন পণ্য, ২৬টা ভার্সন, ৬৬টা দাম (HP 15-fd0180nia-এর একটা ধরে), প্রতিটা ভার্সন ২+ দোকানে, একই CPU, RAM, SSD আর GPU মিলিয়ে: ASUS ১৪ (TUF A15 FA506NCG, TUF A16 FA607NUG/FA607NUQ/FA608UH, TUF F16 FX608JMR, ROG Strix G16 G614PR/G615LM, SCAR 16 G635LW, Vivobook 15 A1504VA/X1504VA, ExpertBook P1 P1503CVA, Zenbook 14 OLED UM3406GA/UX3405CA, V16 V3607VH), HP ৪ (Victus 15-fa2013dx, 15-fb3093dx, 15-fc0074nia, 15-fd2104tu; সাথে আগের 15-fd0180nia-এ Tech Marvels), Dell ১ (15 DC15250), MSI ১ (Cyborg 15 A13VE)। `worker:check` সবগুলোতে ০ মেলেনি।

- **নতুন দোকান Tech Marvels** (WooCommerce, sitemap; প্রায় ২৭৫টা ল্যাপটপ): বেশিরভাগ মডেল কোড বিদেশি বাজারের (fb3093dx, fa2013dx), তাই `unofficial`। যে পাতায় শুধু RAM-এর অপশন ("8 gb / 16 gb") আর SSD লেখা নেই, সেগুলো worker মেলাতে পারে না, তাই নেওয়া হয়নি — এতে TUF A15 FA506NCQ আর FX608JMR 32GB বাদ পড়েছে।
- **Star Tech:** `STARTECH_CATEGORIES`-এ `/laptop-notebook` যোগ; আগে শুধু MacBook ছিল, তাই নতুন Windows ল্যাপটপ discover পেত না।
- অফিসিয়াল দাম: Star Tech-এর দাম (না থাকলে Global Brand, তাও না থাকলে দোকানগুলোর মাঝামাঝি)। Global Brand ASUS-এর পরিবেশক, দাম Star Tech-এর সমান বা কাছাকাছি; Sumash, Apple Gadgets, Tech Marvels-এর দাম প্রায়ই অনেক কম (আনঅফিসিয়াল)।
- **বাকি:** Acer-এর কোনো মডেল একই কনফিগে ২ দোকানে মেলেনি (Nitro V 15, Predator Helios Neo শুধু Apple Gadgets আর Sumash-এ, Sumash-এর দাম "call for price")। Lenovo আর আরও ASUS/HP মডেল (Global Brand আর Star Tech-এ ৬০টার মতো জোড়া পাওয়া গেছে) পরের ধাপে।

### ল্যাপটপে Lenovo আর আরও ASUS (২৯ অক্টোবর ২০২৬, দ্বিতীয় ধাপ)

৯টা নতুন পণ্য, ১৪টা ভার্সন, ৩৩টা দাম; `worker:check` ০ মেলেনি। Lenovo ৭ (LOQ 15IRX10, LOQ 15IRX9, LOQ 15AHP10, Legion 5 15IAX10, Legion 5 15AHP10, Legion Pro 5 16IAX10, IdeaPad Slim 3 15IRH10), ASUS ২ (TUF F16 FX608JHI, ROG Zephyrus G14 GA403WP)।

- **Lenovo-র কোড এক, লাইন আলাদা:** 15AHP10-এ LOQ, Legion 5 আর IdeaPad Slim 3; 15IRX10-এ LOQ আর Legion 5 — তাই কোডের সাথে লাইনের নামও মেলানো হয়েছে।
- **Star Tech-এর "To be announced":** স্টক শেষ হলে Star Tech পাতায় দাম দেখায় না (`product-price">To be announced`), কিন্তু `itemprop="price"` আর `og:price`-এ পুরনো দাম রেখে দেয়, আর worker সেটাই পড়ে। কঠোর নিয়ম ৩ অনুযায়ী এগুলো অফার নয়, তাই এই ধাপে নেওয়া হয়নি (LOQ 15IAX9E, Legion 5 15IRX10, IdeaPad 15IRH10-এর i5 ইত্যাদি বাদ)। প্রথম ধাপের ৬টা পণ্যে (FX608JMR, SCAR 16 G635LW, X1504VA, P1503CVA, Dell 15 DC15250, MSI Cyborg 15 A13VE) Star Tech-এর দাম এমন পাতা থেকে; বাদ দিলে প্রতিটা এক দোকানে নামে, মালিকের সিদ্ধান্ত বাকি। Sumash Tech-এর পাতায় "To Be Announced" থাকে নিচের অন্য পণ্যের, মূল পণ্যের নয়।
- worker নিজে এখনো এই পুরনো দাম পড়ে; ঠিক করলে Star Tech-এর আগের সব স্টক-শেষ দাম প্রতি run-এ "ব্যর্থ" দেখাবে, তাই আলাদা সিদ্ধান্ত।

### খেজুরের গুড় (২৯ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `date-jaggery` (migration `20261029072325_date-jaggery-category.sql`, ভার্সনের ঘর `capacity` = ওজন, মধুর মতো যাচাইয়ের নোট চালু)। মধুর মতো ব্র্যান্ডের প্যাক, কারণ খোলা গুড়ের মান দোকানভেদে আলাদা আর মেলানো যায় না। ৬টা পণ্য, ১২টা দাম, প্রতিটা ঠিক ২টা দোকানে; worker নিজে লাইভ পড়েছে, `worker:check` ০ মেলেনি (Chaldal মাঝে মাঝে 404 দেয়, আবার চালালে ঠিক)। সব ছবি ২০০ image/*।

- Khaas Food পাটালি ৫০০g আর ঝোলা ৫০০g (Khaas Food, Chaldal); Farmer's Gold পাটালি ৫০০g আর ঝোলা ৫০০g (Arogga, Chaldal); Root কিউব ৪০০g আর পাউডার ১৫০g (Arogga, Chaldal)।
- অফিসিয়াল দাম: Khaas Food নিজের দোকানের দাম, Farmer's Gold গায়ের দাম (২২০), Root-এর ঘোষিত দাম নেই, তাই দুই দোকানের মাঝামাঝি।
- মৌসুম নভেম্বর থেকে, তাই এখন প্রায় সবই "স্টকে নেই" (Chaldal-এ Request Stock); দাম আসল, স্টক এলে `prices` নিজে বদলাবে।
- Arogga-র Farmer's Gold পাটালি ৫০০g পাতার বর্ণনায় "Premium Bar" লেখা, কিন্তু শিরোনাম আর গায়ের দাম সাধারণটার; Premium Bar ৫০০g আলাদা পাতা (৭৩৩৪০), নেওয়া হয়নি।
- **নেওয়া হয়নি (এক দোকানে):** Khaas Food পাটালি ১kg, Farmer's Gold পাটালি ১kg, Choice, Gowala, BPM, Desifarm, Poushali, Chuadangar, Root লিকুইড (Arogga ৫০০g, Chaldal ১ লিটার)। Othoba আর Rokomari-তে গুড় নেই, Market Bangla দোকান হিসেবে নেই।

### খেজুরে নতুন দোকান, আর কয়েকটা ভাঙা লিংক ঠিক (২৯ অক্টোবর ২০২৬)

খেজুরে ১৩টা নতুন দাম (৪১ → ৫৪), নতুন দোকান Haramain Store, Khaas Food, Holy Basket। প্রতিটা দাম worker নিজে লাইভ পড়েছে, অফিসিয়াল দামের ৪০%–২৫০%-এর মধ্যে; `worker:check` খেজুরে ০ মেলেনি (Chaldal-এর একটা লিংক মাঝে মাঝে সাড়া দেয় না)।

- **Haramain Store** (Next.js): আজওয়া, মাবরুম, কালমি, সুক্কারি (মুফাত্তাল), মেডজুল — সব 1kg। প্রতিটা ওজনের দাম পাতার ভেতরের JSON-এ, তাই `embeddedVariants`। কালমি ৫০০g আর ১kg দুটোতেই ১৩৫০ লেখা (দোকানের ভুল), তাই শুধু ১kg — এতে কালমি ১kg-এ দ্বিতীয় দোকান এল।
- **Khaas Food** (Next.js): আজওয়া আর মরিয়ম, ২৫০g আর ৫০০g এক পাতায়; `embeddedVariants`।
- **Holy Basket** (WooCommerce): আজওয়া ৫০০g, মরিয়ম ৫০০g আর ১kg, সুক্কারি ১kg। খুরমা ৫০০g ব্র্যান্ড ছাড়া, Rongdhonu-র সাথে মেলে না, তাই নেওয়া হয়নি।
- **নতুন জাত (পরে একই দিনে):** অ্যাম্বার ১kg আর মাশরুক ১kg (Haramain, Chaldal), দাব্বাস ৪০০g, ৫০০g, ১kg (Othoba, Chaldal) — ৩ পণ্য, ৯ দাম; ঘোষিত দাম নেই, তাই অফিসিয়াল দাম দুই দোকানের মাঝামাঝি। Chaldal-এ সবই Request Stock। এখনো এক দোকানে: সুক্কারি রুতাব (Haramain), জাহিদি আর ফারিদা (Othoba); তিউনিসিয়ার খেজুর Othoba-য় ১kg আর Chaldal-এ ৫০০g, ওজন মেলে না। ৩kg শুধু Haramain-এ।
- **বাদ (এবার দেখা):** Market Bangla (পড়া যায়, কিন্তু পণ্যের পাতা রুটে আর দোকানের নিজের ডেটায় ভুল, যেমন "250gm 160tk" পাতায় 70kg ৳44,800), Kintaini (OpenCart, robots/sitemap নেই), Ghorer Bazar আর Cellsii (403), Greenfood (HTML-এ দাম নেই), Chocolate Shop BD (পাতা পুরনো), Daily Shopping (`dailyshopping.com.bd`: React SPA, HTML খালি, sitemap নেই)।
- **Trek N Tread:** সাইট নতুন করে বানানো, পুরনো সব লিংক "Product Not Found"। এখন sitemap আর JSON-LD, তাই আলাদা parser বাদ দিয়ে `sitemapStore`। ৫টা লিংকে শুধু সংখ্যার prefix বাদ (AJ4 এখন ৩৬৯০), Chuck Taylor High-এর নতুন লিংক, AJ1 Low-এর আগের ২০৯০ টাকার কপি নেই — একই রঙের 1:1 গ্রেড ৩৯৯০, প্রিমিয়াম কপি। New Balance 530 Trek-এ আর নেই (বাকি ২ দোকান আছে)। DB-র লিংক migration `20261029063958_trekntread-new-links.sql`-এ।
- **Amazfit Active 2 Premium:** Dazzle আর Genten-এর দুটো দাম "Standard" ভার্সনে বসানো ছিল, যেটা এই পণ্যে নেই (seed এগুলো কখনো বসায়নি); Genten-এর পাতা আসলে সাধারণ Active 2-এর। দুটোই মোছা, এতে Genten-এর Active 2 মেলে।
- **Apple Watch Series 11 @ Star Tech:** পাতায় এখন শুধু 46mm (৪৫৩০০), তাই দামটা 42mm থেকে 46mm-এ।

### রাউটার (২৬ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `router` (migration `20261026110000_router-category.sql`, ভার্সনের ঘর `edition`), ২৫টা পণ্য, ১৬৫টা দাম, নতুন দোকান লাগেনি: Star Tech, Gadget & Gear, Global Brand, Sumash Tech, Apple Gadgets, Diamu, Kry International, PCB Store, Gadget Breeze। Star Tech-এর `/networking/router` ক্যাটাগরি discover-এ যোগ। প্রতিটা পাতা worker parser দিয়ে লাইভ পড়া, `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*, স্পেক Star Tech থেকে।

- সাধারণ (`Standard`): TP-Link Archer C6, C64, C54, C50, C24, C80, AX12, AX53, AX73, BE400; Tenda AC10, TX12 Pro; Mercusys AC10; Cudy WR1200, WR1500, WR3000, WR3600E; ASUS RT-AX52। ২৪টা ৩+ দোকানে, Archer BE400 ২টায়।
- মেশ, ভার্সন `1 Pack` / `2 Pack` / `3 Pack`: TP-Link Deco M4, E4, X10, X20, X50; Cudy M1300, M3000। প্যাক চেনা হয়েছে শিরোনাম/URL/Star Tech তালিকার নাম থেকে ("(2 Pack)", "Single Pack")।
- বাদ: Apple Gadgets আর Gadget Breeze-এর মেশ পাতা (১/২/৩ প্যাকের দাম এক পাতায় লেবেল ছাড়া — কোনটা কোন প্যাক নিশ্চিত না), Gadget & Gear-এর প্যাক না-লেখা Deco X50 পাতা, Deco X50-PoE/Outdoor (আলাদা মডেল), Archer AX15 (সব দোকানে স্টক নেই, দামও অসংগত)।
- `officialPrice`: Star Tech-এর কাটা দাম (প্যাক ধরে)। `releaseYear` খালি — প্রকাশের তারিখ যাচাই করা হয়নি, আন্দাজে বসানো হয়নি।

### দামের ধরন ক্যাটাগরি ধরে, স্নিকার্সে কপি (২৬ অক্টোবর ২০২৬)

- `offer_condition`-এ `replica_premium` আর `replica`; `categories.conditions` (migration `20261026100000_category-conditions.sql`)। ইলেকট্রনিক্সে আগের মতো ওয়ারেন্টি, স্নিকার্সে আসল / প্রিমিয়াম কপি / কপি, স্কিনকেয়ারে শুধু আসল। অ্যাডমিন → ক্যাটাগরিতে বদলানো যায়; দাম বসানোর ফর্মে শুধু ওই ক্যাটাগরির ধরন আসে।
- কপির দামের পাশে অফিসিয়াল/নির্ধারিত দাম বা "−%" দেখানো হয় না (sanity-র `officialPrice` আসল জুতার দাম নয়)। কার্ড আর তালিকায় "কপি" ব্যাজ।
- স্নিকার্সের ২০টা পণ্যের নাম থেকে "1:1 Copy Sneakers" সরানো, ব্র্যান্ড ঠিক (AF-1 → Nike, Samba/Campus → Adidas, AJ-1/AJ-4 → Jordan, Nike SB → Nike), Chuck 70 → Chuck 70 High। পুরনো ঠিকানা `public/_redirects`-এ 301। seed-এর id slug থেকে আসে, তাই `20261026100100_sneakers-replica.sql` পুরনো ২০টা পণ্য মোছে (দাম, ইতিহাস, এদের price alert সহ), seed নতুন করে বসায়।
- প্রতিটা দামের ধরন দোকানের নিজের লেখা থেকে: ১৫টা প্রিমিয়াম কপি (1:1, Premium, Three's-এর "Quality: 1:1 Replica"/"Customised (1:1)", Trek-এর "Grade – 1:1"), ৪৯টা কপি (OEM, OEM Superior, বা কিছু লেখা নেই)। Trek N Tread worker-এ `replica`; discover শিরোনাম দেখে ভাগ করে।
- ভুল লিংক বাদ: Samba Vegan/Sneaker Zone (এখন Campus 00s Brawn খোলে), NB 530/DOB (NB 471), Adios Pro Evo 1/Splayd (Bad Bunny), Adios Pro 4/Ragen (Y-3 Adios Pro 4 — আলাদা লাইন), Splayd-এর Jordan 1 Low আর Evo SL (৪০৪)। Samba Vegan, Adios Pro Evo 1, Adios Pro 4 এখন ২টা দোকানে।
- Converse খোঁজা: নতুন মডেলের আলাদা মালিকের ২টা দোকান নেই (Chuck 70 Low আর Run Star Trainer শুধু DOB + Sneaker Zone, একই মালিক)। Errum (errumbd.com) Terms-এ লিখিত অনুমতি ছাড়া দাম সংগ্রহ নিষেধ — বাদ, অনুমতি চাইলে আবার দেখা যাবে। Othoba-র Converse নামহীন "Converse-style", Cosmic Belleza ১,৬৫০ টাকার জুতাকে "authentic" বলে — বাদ।

### নেকব্যান্ড (২৬ অক্টোবর ২০২৬)

২৬টা নতুন পণ্য (ক্যাটাগরি `earbuds`, ভার্সন `Standard`), ১১৭টা দাম, নতুন দোকান লাগেনি — ৮টা পুরনো দোকানেই বড় তালিকা: Star Tech, Sumash Tech, Apple Gadgets, Gadget & Gear, Motion View, Diamu, Kry International, Gadget Breeze। মালিকের শর্ত অন্তত ২ দোকান; ২২টা পণ্য ৩+ দোকানে, ৪টা (Realme Buds Wireless 5 Lite, 3 Neo, Acefast N9, HiFuture FutureMate) ২টায়। প্রতিটা পাতা worker-এর parser দিয়ে লাইভ পড়া (দাম, স্টক, শিরোনামে মডেল), `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*।

- OnePlus Bullets Wireless Z3, Z2 ANC; Oraimo Necklace 5 ANC (OEB-611), Neo (OEB-310), Lite (OEB-311), 4 (OEB-E50D); QCY BassBloom ANC N2, TuneArc N1; Realme Buds Wireless 5 ANC, 5 Lite, 3 Neo; Edifier W280NB Pro; JBL Tune 125BT; Anker Soundcore R500, Life U2i; Baseus Bowie P1x; OPPO Enco M33; Redmi SonicBass; Lenovo HE05X II; Hoco ES70, ES69, ES62 Plus; Foneng BL34, BL40; Acefast N9; HiFuture FutureMate।
- `officialPrice`: Star Tech-এর কাটা দাম; Star Tech-এ না থাকলে অফিসিয়াল দোকানের (Motion View) বা কাটা দাম।
- `releaseYear` শুধু যেগুলোর প্রকাশের খবর পাওয়া গেছে (OnePlus, Realme, OPPO, Anker R500, Redmi); Oraimo, QCY, Hoco, Foneng, Acefast, Edifier ইত্যাদির খালি রাখা, আন্দাজে নয়।
- আগের "OnePlus Bullets Wireless Z2 Neckband"-এর Diamu লিংকটা আসলে Z2 ANC-এর পাতা ছিল (ভুল মডেল) — ক্যাটালগে ঠিক করা, ৭টা দোকানে আসল Z2-এর পাতা। seed insert-only, তাই ডিবিতে পুরনো ভুল অফারটা হাতে মুছতে হবে।
- বাদ: CMF Neckband Pro, Oraimo Necklace Pro, JBL Live 200BT — সব দোকানে স্টক নেই; Star Tech-এর Realme 3 Neo ছবি ৪০৩।
- worker: Star Tech discover-এ `/neckband` ক্যাটাগরি।

### পানির ফিল্টার (২৬ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `water-purifier` (পানির ফিল্টার, আইকন `droplet`, ভার্সনের ঘর নেই, সব `Standard`)। ৭টা পণ্য, ২৩টা দাম, ৫টা দোকান (`data/catalog/water-purifier.json`): Pureit Classic (23L), Marina, Wave, Vital Max, Ultima Mineral, Ultima Pro, আর Kent Grand Star; দাম ৳৪,৯৪৯ থেকে ৳৩৫,০০০। প্রতিটা ৩+ দোকানে, `worker:check` ০ মেলেনি, ২৫টা ছবিই ২০০ image/*।

- নতুন দোকান **MK Electronics** (mke.com.bd) আর **Othoba** (othoba.com)। robots.txt-এ পণ্যের পাতা খোলা, Terms-এ সংগ্রহ নিয়ে নিষেধ নেই। `probe-stores` workflow দিয়ে GitHub Actions থেকে দুটোই খোলে, দাম আর ছবি পড়া যায় (run 40275232438)।
- **Rokomari বাদ:** লোকাল থেকে খোলে, কিন্তু GitHub Actions থেকে robots.txt-এই 403। তাদের Terms পাতা JS-এ, পড়া যায়নি। এতে Heron, Sanaky, Vision এর মডেলগুলো ২টা দোকানে নামে (Othoba + Rokomari), তাই নেওয়া হয়নি।
- Othoba মার্কেটপ্লেস: একই মডেল কয়েক বিক্রেতার, আর একটা দোকানে একটাই দাম রাখা যায়। Pureit-এর লিংক RFL Best Buy-এর, Kent-এর SKRP Group-এর। Kent Grand Star পাতার `<title>` বিক্রেতার ভুলে অন্য মডেলের ("Ultra Storage UV 8L"), h1 আর spec (9 litres) ঠিক।
- `officialPrice`: MRP। MKE-র `mrp_price` আর Othoba-র মূল দাম দুটো মেলে (Classic ৫,৪৯৯ শুধু Othoba)। Star Tech-এর "Regular Price" আসলে EMI দাম, MRP নয়।
- Star Tech-এর "Pureit Ultima 10 Liter" আর অন্যদের "Ultima Mineral RO+UV+MF 10L" একই মডেল (২৮ L/ঘণ্টা, বর্ণনায় mineral)।
- নামের প্রযুক্তি আর লিটার বন্ধনীতে (`Marina (RO+UV+MF, 6L)`), কারণ Star Tech-এর শিরোনামে "RO+UV" থাকে না আর "23 Liter" ≠ "23L"; বন্ধনীর অংশ মেলানোয় বাধ্যতামূলক নয়।
- `releaseYear` শুধু Vital Max (Vital series অক্টোবর ২০২২); বাকিগুলোর প্রকাশের তারিখ পাওয়া যায়নি, খালি।
- বাদ: Pureit Marvella (Star Tech + MKE, ২টা), Kent-এর বাকি মডেল (Apple Gadgets + MKE বা Othoba, ২টা), Panasonic TK-CS10 (Othoba + Apple Gadgets)।
- worker: Star Tech discover-এ `/water-purifier`।

### মেকআপ (২৬ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `makeup` (মেকআপ, আইকন `palette`, ভার্সনের ঘর `capacity`, দামের ধরন শুধু আসল, ওয়ারেন্টি নেই, `verify_note` চালু)। ১৮টা পণ্য, ১৭০টা দাম, ১৯টা দোকান: স্কিনকেয়ারের ১৪টা আর নতুন ৫টা (`data/catalog/makeup.json`)। প্রতিটা ৪–১৪ দোকানে, `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*।

- নতুন দোকান: **Beauty Booth**, **ALZAK**, **BD Amajan Shop**, **UK Direct BD**, **Skin Revive BD**। robots.txt-এ পণ্যের পাতা খোলা; Terms-এ সংগ্রহের নিষেধ নেই (UK Direct-এ সাধারণ "content কপি নয়" লেখা, Klassy-র মতো)। `probe-stores` দিয়ে GitHub Actions থেকে পাঁচটাই খোলে (run 40279963494)। The Mall BD Actions থেকে 403, বাদ। Rupchorcha, Taupe Notch, Authentic Makeup Store-এর Terms-এ bot/scraping নিষেধ; Ogerio, Lavishta bot কে Cloudflare challenge দেয়; NurPlaza robots-এ scraper বন্ধ — সব বাদ।
- একটু কম দাম, তবে নিয়মের মধ্যে: BD Amajan-এর SuperStay Matte Ink ৭৯০ (অন্যরা ১,১০০–১,৫৫০) আর Pond's BB+ ২২০ (অন্যরা ৩০০–৩৭৫)।

- Essence Lash Princess False Lash (সাধারণ আর Waterproof), I Love Extreme Crazy Volume; Maybelline Colossal Kajal, Lash Sensational Sky High, Baby Lips Color SPF11, SuperStay Matte Ink, SuperStay Vinyl Ink, Fit Me Matte + Poreless; Lakme Eyeconic Kajal; W7 Liquid Eyeliner Pot; Technic Mega Lash (Water Resistant, Volumising); Pond's Bright Miracle BB+; Wet n Wild MegaLast Catsuit, Photo Focus Dewy, Photo Focus Matte; L'Oréal Infallible 32H Fresh Wear।
- প্রার্থী বের করা: ৪০টা দোকানের listing-এ নামের শব্দ মিলিয়ে, তারপর প্রতিটা পাতা worker-এর parser দিয়ে পড়ে (৩৫৮ পাতা)। শেড রং, তাই আলাদা ভার্সন নয়; প্রতিটা দোকানে একটাই লিংক, স্টকে থাকা সবচেয়ে কম দামের শেড।
- বাদ রাখা listing: মেয়াদের কাছাকাছি ("Expiry – …"), combo/"Buy one get one", twin pack, tube/powder রূপ, আর অস্বাভাবিক দাম (Klassy Missy-র Lash Princess ১,২৫০, অন্যরা ৫৫০–৭৫০)।
- উৎস দেশে দাম আলাদা: Fit Me "Made in India" ~১,০০০, "USA" ১,২৫০–২,২৫০। তাই Fit Me-তে শুধু ~১,০০০-এর দোকান (Arogga, Shajgoj, Klassy, Beprincess India); Lira Import, Color World, Perfecto, OHSOGO, Skincare Shop বাদ। Beprincess-এর অফারে region `India`।
- বাদ মডেল: Instant Age Rewind (৬ml বনাম ৬.৮ml, দেশভেদে আলাদা), Colossal Mascara (অনেক রূপ, মেলানো কঠিন), MAC আর SHEGLAM (নকল বেশি)।
- `officialPrice`: বাংলাদেশে MRP প্রকাশিত নেই, তাই দোকানগুলোর মূল দামের (কাটা দাম বা দাম) মধ্যমা। `releaseYear` খালি।

### মোবাইল: Honor, Tecno, Infinix, Motorola (২৬ অক্টোবর ২০২৬)

২৫টা নতুন ফোন, ৪১টা ভার্সন, ১৭৯টা দাম, নতুন দোকান লাগেনি: Star Tech, Gadget & Gear, Kry International, Sumash Tech, Apple Gadgets, Dazzle, Diamu। প্রার্থী বের করা হয়েছে Star Tech-এর ব্র্যান্ড পাতা (`/honor-mobile-phone` ইত্যাদি) আর ৮টা দোকানের product sitemap মিলিয়ে; তারপর ২০০টা পাতা worker-এর parser দিয়ে পড়ে দাম, স্টক আর ভার্সন। প্রতিটা ফোন ৩–৬টা দোকানে, `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*।

- Honor: X5c, X5c Plus, X6c, X6e, X7d, X7e, X8d, X9d, 400, 400 Pro, 600, 600 Pro। Tecno: Spark Go 3, Spark 50C, Spark 50, Spark 50 Pro, Camon 50, Pova Curve 2 5G, Camon Air, Camon Slim 5G। Infinix: Smart 20, Hot 70, Note Edge, Note 60, Note 60 Pro।
- `officialPrice`: অফিসিয়াল চ্যানেলের (Gadget & Gear, Kry/Sumash-এর `-official` পাতা) MRP, MobileDokan-এর "(Official)" দামের সাথে মেলানো। যেখানে আলাদা (Camon 50, Pova Curve 2, Note Edge 8/256), সেখানে দোকানগুলোর MRP নেওয়া। `releaseYear` MobileDokan-এর release date থেকে।
- Gadget & Gear-এ প্রতিটা RAM/স্টোরেজের আলাদা লিংক, মূল লিংকের ভার্সন পাতার JSON-LD নাম থেকে (যেমন "HONOR X7d (8/256GB)")।
- condition: লিংক বা শিরোনামে "Official" থাকলে official, নয়তো দোকানের কনফিগ। Kry আর Sumash-এর non-official পাতা (INT/Global) আলাদা আনঅফিসিয়াল অফার।
- **Star Tech-এর স্টক নিয়ে অমিল (ঠিক করা হয়নি):** X6c, X9d আর Smart 20-এর পাতায় "Status: Out Of Stock", কিন্তু ভার্সনের API (`/product/product/variation`) "In Stock" বলে। ক্যাটালগে পাতার লেখাই রাখা (`inStock: false`); তবে `prices` run API পড়ে, তাই সিঙ্কের পর স্টকে দেখাতে পারে।
- বাদ রাখা অফার: Star Tech-এর "Tecno CAMON Slim" (দাম আর ভার্সন 5G-র মতো, কিন্তু নেটওয়ার্ক লেখা 2G/3G/4G; MobileDokan-এ "Camon Slim" আলাদা ফোন, তাই মডেল নিশ্চিত না, নিয়ম ২); Star Tech-এর Spark 50C 4/128 (স্টকে নেই, দাম 4/64-এর হুবহু, ভুল মনে হয়); Diamu-র X7d (region লেখা "official bd", condition নিশ্চিত না); Kry-র X5c পাতা (দাম পড়া যায়নি); Diamu-র যেসব পাতায় দাম পড়া যায়নি; Sumash-এর X7d 8/512 (ক্যাটালগে ওই ভার্সন নেই)।
- বাদ রাখা ভার্সন (অফিসিয়াল দাম নেই, শুধু আনঅফিসিয়াল): Honor 400 12/256 আর 8/256, Honor 600 12/512, 600 Pro 12/512, X9d 8/256।
- বাদ মডেল: ঘোষণা হয়েছে কিন্তু দাম নেই (Honor 400 Smart 5G, X9e Pro, Tecno Pova 7 5G, Spark Slim, Camon 50 Pro, Infinix Note 60 Ultra, GT 50 Pro); ২টা দোকান (Infinix Hot 70 Pro 5G, Smart 10); সব দোকানে স্টক নেই (Tecno Spark 50 5G)।
- **Symphony আর Walton বাদ:** আমাদের কোনো দোকানে Symphony-র ফোন নেই। Walton-এর নতুন ফোন (Xanon, NexG, ZenX) শুধু Kry-তে, Diamu-তে পুরনো Primo; ৩ দোকানের শর্ত পূরণ হয় না। ওদের নিজেদের সাইট যোগ করলেও প্রতিটা ফোনে একটাই দোকান হতো।
- **Motorola (মালিকের সিদ্ধান্তে অফিসিয়াল দাম ছাড়া):** ৯টা ফোন, ১৬টা ভার্সন, ৪১টা দাম — Edge 70 Pro, Edge 70 Pro Plus, Edge 70, Edge 70 Fusion, Signature, Moto G67 Power, G57 Power, G06 Power, G86 Power; প্রতিটা ৩–৪টা দোকানে (Apple Gadgets, Kry, Sumash, Diamu, Dazzle)। সবই আনঅফিসিয়াল (Kry লেখে India); বাংলাদেশে অফিসিয়াল বিক্রি নেই, MobileDokan-ও "(Unofficial)" লেখে, তাই `officialPrice` খালি (কঠোর নিয়ম ৪-এর ব্যতিক্রম)। স্পেক আর `releaseYear` MobileDokan থেকে, ছবি দোকানের CDN থেকে। বাদ: Moto G05, G45, G64, Edge 50 Fusion, Edge 50 Pro (সব দোকানে স্টক নেই, ২০২৪-এর মডেল), আর ২টা দোকানের মডেল (G37/G77 Power, Edge 60 সিরিজ, Razr 60)।
- "Edge 70 Pro+" নামে slug "motorola-edge-70-pro" হয়ে Edge 70 Pro-র সাথে মিলে যেত (`slugify` "+" ফেলে দেয়), আর `catalog:build` চুপচাপ দ্বিতীয়টা বাদ দিত; তাই নাম "Edge 70 Pro Plus"।
- region: Diamu `int` লেখে, `src/utils/region.ts`-এ `int` → Global যোগ।
- `scripts/import-catalog.mjs`: দাম ১,৯০০ ছাড়ানোয় `catalogOffers`-এর object literal-এ TypeScript TS2590 দিচ্ছিল; এখন অ্যারেটা `JSON.parse` দিয়ে লেখা হয়।

### ১টা দোকানের পণ্যে দোকান বাড়ানো (২৬ অক্টোবর ২০২৬)

পুরনো ১৪টা পণ্য আর নতুন ৪টা ভার্সন ১টা দোকানে ছিল। ৫৩টা দোকানের পুরো listing (২ লাখের বেশি লিংক) থেকে মডেল ধরে খুঁজে, প্রতিটা পাতা worker-এর parser দিয়ে পড়ে, `worker:check` পাস করা দামই রাখা।

- **নতুন দোকান:** Arafa Telecom (arafatelecom.com) আর Mobile Buzz BD (mobilebuzzbd.com)। robots.txt-এ পণ্যের পাতা খোলা। Terms-এ শুধু সাধারণ "content কপি/পুনঃপ্রকাশ নয়" লেখা, scraping/bot-এর কথা নেই (UK Direct-এর মতো)। লোকাল `probe` পাস; **GitHub Actions-এর probe বাকি** (main-এ push লাগে)।
- বাদ রাখা দোকান: Rio International (Terms ঠিক আছে, কিন্তু ভার্সনের দাম নিজেদের JSON-এ, নতুন parser লাগত; Realme 14 Pro+ এমনিতেই ৪ দোকানে পৌঁছেছে), SMS Gadget (Cloudflare challenge), Phone Sell BD (সাইট খোলে না)।
- worker: `wooVariants` "12-256-gb" ধরনের অপশন-slug-কে এখন "12/256gb" পড়ে (আগে "12 256 gb" হয়ে RAM চেনা যেত না)। শুধু এই ধরনের slug বদলায়, পুরনো দোকানের বাঁধা `variant_key` বদলায় না।
- এখন ৩+ দোকানে: Galaxy Tab A9 LTE (৬), MatePad 11.5 (৫), Idea Tab (৩), Pad 7 (৭), Nord CE5 (৫), Nord 4 (৪), Nord CE4 Lite (৪), Pixel 8a (৫), Realme 14 Pro+ (৪), Realme 14 5G (৮), Realme C75 (৪), nova Y74 (৪)। নতুন ফোনের X9d 12/512 (৪), Edge 70 Fusion 8/256 (৫), G67 Power 12/256 (৪)।
- **ট্যাবলেটের ভার্সন:** Tab A9 LTE, MatePad 11.5, Idea Tab আর Pad 7-এ একটাই ভার্সন "Standard" ছিল, অথচ দোকানের পাতায় RAM/স্টোরেজ/Wi-Fi অপশন — worker মেলাতে পারত না। এখন `64GB Wi-Fi + Cellular`, `128GB Wi-Fi`, `256GB Wi-Fi + Cellular`, আর Pad 7-এ `8GB / 128GB Wi-Fi` + `8GB / 256GB Wi-Fi`। ডেটাবেসে পুরনো সারির নাম বদলাতে migration `20261026150000_tablet-variant-labels.sql` (seed-এর আগে চালাতে হবে)। Pad 7-এর PCB Store-এর পুরনো দাম (৳৪৩,০০০, কোন ভার্সন পাতায় লেখা নেই) মুছে ফেলা। অফিসিয়াল দাম: MatePad ৪৯,৯৯৯ আর Idea Tab ৩৮,৯৯৯ (Gadget & Gear), Pad 7 Star Tech-এর regular দাম।
- বাদ রাখা অফার: Kry-র যেসব লেবেলে দ্বিতীয় সংখ্যায় GB নেই ("8GB / 128") — worker মেলাতে পারে না; Apple Gadgets-এর Tab A9 "LTE" অপশন (একই কারণ); Sumash Pixel 8a 8/256 ৳৮৬,৯৯৯ (অবিশ্বাস্য); PCB-র Nord CE5 ৳২৬,০০০ (অন্যরা ~৪২,০০০); Mobile Buzz-এর nova Y74 8/128 আর Idea Tab (5G না Wi-Fi নিশ্চিত না); যেসব পাতায় ভার্সন লেখা নেই (CustomMacBD, Rio)।
- **এখনো ৩ দোকানের কম:** Teclast P30T (Star Tech + Diamu, Diamu-র পাতায় চিপ "A532" লেখা, Star Tech-এর পাতায় চিপ নেই, তাই নেওয়া হয়নি), Motorola Edge 70 12/256 (শুধু Apple Gadgets), SKIN1004 Madagascar Centella Ampoule **50ml** (শুধু Emart; বাকি সব দোকানে ৫৫ml — আলাদা সাইজ, তাই মেলানো হয়নি)।
- ভার্সনে দাম নেই (আগে থেকেই): Nord CE5 12/256, Pixel 8a 8/256, Realme 14 5G 8/256।

### বেবি পণ্য (২৭ অক্টোবর ২০২৬)

নতুন ক্যাটাগরি `baby` (বেবি পণ্য), ভেতরে `diapers` (ভার্সনের ঘর `size` + `capacity` = প্যাকে কয়টা, লেবেল `M 40pcs`) আর `baby-care` (`capacity` = ml/g/pcs)। migration `20261027100000_baby-categories.sql`। ২৭টা পণ্য, ৫৬টা ভার্সন, ২১৮টা দাম, ২০টা দোকান। **প্রতিটা ভার্সন অন্তত ২ দোকানে (মালিকের নিয়ম)**, ৪২টা ৩+ দোকানে; ১ দোকানের ভার্সন রাখা হয়নি (Twinkle XL 22, শুধু Arogga)। প্রতিটা পাতা worker parser দিয়ে লাইভ পড়া, `worker:check` ০ মেলেনি, সব ছবি ২০০ image/*।

- **দোকান:** Arogga, MedEasy, Shajgoj, BanglaShoppers; আগের স্কিনকেয়ারের দোকানের sitemap ঘেঁটে Beauty Booth, Chardike, Glowella, Skincare Shop, UK Direct BD, Cosmetics Corner, EmartWay, Emart, Color World, BD Amajan, Beprincess, IndianMartBD, OHSOGO; ডায়াপারের জন্য নতুন **eFamas** (`efamas.com.bd`, WooCommerce, `workers/stores/index.ts`-এ entry, `probe.ts`-এ লিংক; robots আর Terms ঠিক আছে, **GitHub Actions-এর probe বাকি**), আর Othoba (Twinkle XL 32-এর পাতা সরাসরি)।
- **নতুন দোকান যাচাই করে বাদ:** Smart Eshop BD (robots.txt-এ AI bot বন্ধ), Motherland BD (পাতা JS-rendered), Asmishop (parser দাম পায় না), Rokomari (Actions থেকে আটকায়, দাম পুরনো হয়ে যেত)।
- **বাদ রাখা অফার:** OHSOGO-র কয়েক সাইজের পাতা (সব স্টকে নেই, দাম উল্টোপাল্টা, যেমন 200ml তেল ৳১৪৯), Beauty Booth-এর Johnson's 100ml (৳৯৫০, 200ml-এর চেয়ে বেশি), Chardike-এর JfB Wash 200ml (100ml-এর চেয়ে কম), UK Direct আর Color World-এর Johnson's শ্যাম্পু (UK ভার্সন / "Ultra Gentle" আলাদা)।
- **NeoCare:** Arogga-র 50-প্যাক আসলে Premium লাইন (eFamas-এর Premium MRP ১,২০০/১,৪৫০/১,৬৫০/১,৯৫০-এর ৮৫–৯৫%), তাই পণ্যের নাম "Premium Belt Baby Diaper" (S/M/L/XL 50); New Born 20 আলাদা পণ্য।

- **কোন পণ্য, কেন:** Arogga-র পণ্যের পাতায় অর্ডারের সংখ্যা থাকে (`pvc_ordered_count`)। ~১,৫৫০টা বেবি পণ্যের সংখ্যা এনে বেশি বিক্রির পণ্য বাছা; ১,০০০+ অর্ডারের পণ্যে `popular: true`। বেবি কেয়ার: Aveeno Daily Care Lotion, Sudocrem, Himalaya (lotion, cream, powder, soap), Sebamed Extra Soft Cream, Parachute Just for Baby (lotion, wash, face cream, powder, oil, shampoo), Meril (powder, oil, shampoo, lotion, soap), Johnson's (shampoo, oil with Vitamin E), Kodomo (anti-rash lotion, Pink Hanabaki cream), NeoCare আর Supermom wipes। ডায়াপার: Savlon Twinkle Pant (১০টা সাইজ/প্যাক), NeoCare Premium Belt (S/M/L/XL 50), NeoCare New Born 20।
- **সাইজ মেলানো:** Shajgoj-এর শিরোনামে সাইজ নেই, পাতার `"size"` ঘরে থাকে; Arogga-র নামে সাইজ না থাকলে পাতার `pu_base_unit_label` দেখে মেলানো।
- **Chaldal বাদ (মালিকের সিদ্ধান্ত):** পাতা খুব ধীর, `worker:check` ১০ মিনিটেও শেষ হয়নি, sitemap-এর কিছু লিংক 404।
- **বাদ রাখা:** Johnson's Baby Cream (দোকানভেদে ৩১৭–১,৩৫০ টাকা, দেশভেদে আলাদা মাল), NeoCare-এর MedEasy/BanglaShoppers ডায়াপার (প্যাকে কয়টা মেলে না, দাম উল্টোপাল্টা), Mum Mum ডায়াপার (দোকানভেদে প্যাক আলাদা), শিশু ফর্মুলা আর Cerelac (দুধের বিকল্প নিয়ে ২০১৩-এর আইন; সিদ্ধান্ত বাকি), Fay Cotton Buds (শুধু Arogga), Arogga-র "Imported" Aveeno, বেবি টুথপেস্ট (প্রতি ফ্লেভারে আলাদা পাতা, পরে)।
- **খেয়াল:** Kodomo Pink Hanabaki-তে Shajgoj-এর দাম Arogga-র প্রায় অর্ধেক (দুটোই স্টকে নেই)। BanglaShoppers স্টক দেয় না (`inStock: null`)।

### নতুন প্রজন্মের ফোন (২৭ অক্টোবর ২০২৬)

Samsung-এর S/Z সিরিজ, Pixel আর বড় ব্র্যান্ডের নতুন ফোন ছিল না। ১৬টা দোকানের পুরো listing (~৬৫,০০০ লিংক) থেকে worker-এর নিজের `findProducts` দিয়ে পাতা বাছা, `readPage` দিয়ে পড়া, `place()` দিয়ে ভার্সনে বসানো — মানে রাতের `discover` যেভাবে মেলায় হুবহু সেভাবে। ৩৪টা ফোন, ৬৬টা ভার্সন, ~২৭০টা দাম; প্রতিটা ভার্সন ২+ দোকানে (Pixel 11 Pro XL আর Reno15 Pro ঠিক ২টায়), `worker:check` ০ মেলেনি, সব ছবি ২০০।

- **Samsung:** Galaxy S26, S26 Plus, S26 Ultra, S26 FE, Z Fold8, Z Flip8, A37 5G, A27 5G। **Google:** Pixel 11 Pro, 11 Pro XL, 11 Pro Fold। **Xiaomi:** 17T, 17T Pro, POCO F8 Pro, POCO X8 Pro। **OnePlus:** 15, 15R, Nord 6, Nord CE6। **Vivo:** X300, X300 Pro, X300 Ultra, X300 FE, V70, V70 Elite। **OPPO:** Find X9, Find X9 Pro, Find X9 Ultra, Reno15, Reno15 Pro। **Nothing:** Phone 4a, Phone 4a Pro। **Realme** 16 Pro, **Honor** Magic8 Pro।
- **নাম:** "Galaxy S26+" নয়, "Galaxy S26 Plus" — নামে `+` থাকলে worker-এর `place()` কোনো অপশন মেলায় না (দোকানও "Plus" লেখে)। সব ভার্সনে RAM এক হলে লেবেল শুধু স্টোরেজ (`256GB`)।
- **অফিসিয়াল দাম:** official দোকানের দামের মাঝামাঝি; official দোকান না থাকলে `null` (Pixel, Vivo X300, Find X9 ইত্যাদি)।
- **স্পেক:** Star Tech-এর পাতা থাকলে সেটা, নাহলে Mobile Dokan (`fetch-specs`-এর দুটোই চেনা)। `releaseYear` Mobile Dokan-এর তারিখ মিলিয়ে, চীনে আগে ঘোষণা হলে সেই বছর (Reno15, Magic8 Pro ২০২৫)।
- **বাদ:** Pixel 11 (শুধু Star Tech), Pixel 10a (ভার্সন-ধরে ২ দোকান হয়নি), Xiaomi 17 আর 17 Ultra (আসলে ১টা দোকান; বাকি মিল ব্যাটারি/জুসার), Nothing Phone 4 (দোকানে নেই)।

### নতুন দোকান: Shei Tech, Zapatos, BabyCare, Dolbear, HNS Tech (২৭ অক্টোবর ২০২৬)

মালিকের চাওয়া ৫টা সাইট robots.txt, Terms আর পাতার দাম-মার্কআপ মিলিয়ে যাচাই। `discover store <id>` লোকালে চালিয়ে ম্যাপ: **Shei Tech ৫৬ দাম, Dolbear ৪৪, BabyCare ১৬, Zapatos ০, HNS Tech ১২।** Dolbear-এর অনিশ্চিত ম্যাচটা (TP-Link Deco E4 ৳৫,৯৯৯ → 2 Pack) অনুমোদনের পরে অফার হিসেবে বসেছে। নমুনা দাম লাইভ পাতায় মিলিয়ে দেখা (Realme 14 5G ৳৪১,৯৯৯, Archer AX53 ৳৫,৪০০)।

| দোকান | সাইট | listing | দাম | কন্ডিশন |
|---|---|---|---|---|
| Shei Tech | sheitech.com.bd | WooCommerce, product sitemap ×২ | `wooVariants`, JSON-LD | unofficial |
| Zapatos | zapatos.com.bd | WooCommerce, `wp-sitemap-posts-product-1.xml` | `wooVariants` | official (নিজেদের ব্র্যান্ড) |
| BabyCare | babycare.com.bd | OpenCart; sitemap-এ শুধু ক্যাটাগরি — ৭টা ক্যাটাগরি পাতায় `?page=` | `itemprop="price"` (ছাড়ের দাম), og-এ মূল দাম | official |
| Dolbear | dolbear.com.bd | কাস্টম (Laravel), `/sitemap/products.xml` | JSON-LD | unofficial |
| HNS Tech | hnstechbd.com | কাস্টম, sitemap নেই — worker স্টোর `/shop?page=1..6` ঘুরে | `data-variants` JSON (`hnstechVariants`) | unofficial |

- Shei Tech: চার্জার, পাওয়ার ব্যাংক, রাউটার, স্মার্টওয়াচ, ইয়ারবাডে ভালো ম্যাচ (Anker Zolo A1695, Archer AX53 ইত্যাদি মডেল-কোডসহ URL)।
- Dolbear: রাউটার (TP-Link, Tenda), ফোন (OPPO A6, Realme 14 5G), চার্জার, ইয়ারবাড। এক স্টোরেজ এক URL (`oppo-a6-6-128gb`)।
- BabyCare: ডায়াপার (Savlon Twinkle, NeoCare Premium), ওয়াইপস, লোশন/ক্রিম/শ্যাম্পু; ক্যাটাগরি পাতায় ২৪টা করে পণ্য, `product-item` টাইলের `itemprop="url"` + `name` থেকে listing।
- Zapatos: নিজেদের ব্র্যান্ডের জুতা (Hyper Stride, Urban Heritage) — ক্যাটালগের ১:১ কপি মডেলের সাথে মেলে না; ওদের মডেল ক্যাটালগে আনা হলে কাজে লাগবে (প্লাম্বিং তৈরি)।
- HNS Tech: Apple-কেন্দ্রিক (AirPods, Watch, Mac, iPad; অনেকগুলো USA ভার্সন)। robots খোলা; sitemap/JSON-LD নেই বলে `/shop` পেজিনেশন ঘুরে listing নেয়, পণ্য পাতার `data-variants='[{…}]'` JSON থেকে কনফিগ-ভেদে দাম-স্টক (`hnstechVariants`)। pre-order পাতার দাম ০ (বুকিং ফি আলাদা), তাই সেগুলো নিজে থেকেই বাদ। নমুনা দাম লাইভে মিলিয়ে দেখা (AirPods Pro 3 ৳২৫,৫০০, Galaxy Watch8 ৪০mm ৳২৬,০০০)।

### পুরনো কিন্তু চলতি মডেল (২৮ অক্টোবর ২০২৬)

শুধু নতুন প্রজন্ম ছিল; বাজারে যা এখনো বেশি বিকোয় (M1–M4 Mac, S24/S25, iPhone 15/16, পুরনো ট্যাব) ছিল না। ২০টা দোকানের sitemap listing থেকে লিংক বাছা, প্রতিটা পাতা curl আর `worker:check` দিয়ে লাইভ পড়া। ১১৪ পণ্য, ৩২৩ ভার্সন, ১,৪৭৭ দাম, ছয়টা batch ফাইলে; পুরো ক্যাটালগের `worker:check`-এ নতুন দামের একটাও অমিল নেই।

| ফাইল | পণ্য | দাম | কী আছে |
|---|---|---|---|
| `mac-air-older.json` | ৭ | ১০৩ | MacBook Air 13" M1, 13"/15" M2, M3, M4 |
| `mac-pro-older.json` | ১০ | ১০৭ | MacBook Pro 14" M4/M4 Pro/M4 Max, 16" M4 Pro/M4 Max, Mac mini M4/M4 Pro, Mac Studio M4 Max/M3 Ultra, iMac 24" M3 |
| `iphone-older.json` | ৯ | ১৫৬ | iPhone 16 Plus/Pro/Pro Max/16e, 15/15 Plus/15 Pro/15 Pro Max, 14 |
| `samsung-more.json` | ২০ | ২৪২ | Galaxy S25/Plus/Ultra/FE/Edge, S24/S24 Ultra/S24 FE, Z Fold7/Flip7/Flip7 FE, A56/A36/A26 5G, A16 4G/5G, A06, M36/M17/M47 5G |
| `mobile-more.json` | ৩৭ | ৪৭১ | Pixel 9/9 Pro/9 Pro XL/9a, 10/10 Pro/10 Pro XL/10 Pro Fold/10a; Redmi Note 14 আর 15 সিরিজ, Redmi 15/15C, Xiaomi 15/15T/15T Pro, POCO X7 Pro/F7/F7 Pro/M7 5G/M7 Pro 5G; OnePlus 13/13R/13s/Nord 5; Nothing Phone 3/3a/3a Pro, CMF Phone 2 Pro |
| `tablet-more.json` | ৩১ | ৩৯৮ | iPad (A14), iPad Air M2/M3 11"/13", iPad Pro M4 11"/13", iPad mini (A15); Galaxy Tab S9 FE, S10 FE/FE Plus/Plus/Ultra, S11/S11 Ultra, A9 Plus, A11/A11 Plus; Redmi Pad 2 (9.7"/11")/2 Pro/Pro/SE 11"/SE 8.7", Xiaomi Pad 7 Pro/Pad 6; OnePlus Pad 3/Pad Lite/Pad Go 2; Honor Pad X8a/Pad 10 |

- **নাম:** `+` নয়, `Plus` (Redmi Note 14/15 Pro Plus 5G, Galaxy Tab A9 Plus)। `import-catalog`-এর slug `+` ফেলে দেয়, তাই "Note 14 Pro+ 5G" আর "Note 14 Pro 5G" একই slug পেয়ে দ্বিতীয়টা চুপচাপ বাদ পড়ত।
- **স্টক:** পুরনো মডেলের অনেক দাম `inStock: false` (Gadget & Gear-এর প্রায় সব iPad/Mac/iPhone 16, M1–M3 Air)। S24/S24 Ultra, Tab S9 FE, Tab A9 Plus, iPad Air 13" M2 শুধু Dazzle-এ স্টকে; POCO M7 Pro 5G ২ দোকানে, দুটোই স্টক আউট।
- **অফিসিয়াল দাম:** Apple-এ Gadget & Gear-এর পাতার দাম, Samsung/Xiaomi/OnePlus-এ দুই+ official দোকান মিললে, নাহলে `null`। S24 FE-তে Gadget & Gear/Mobile Buzz-এর "official" ৳১,২৪,৯৯৯–১,৩২,১৯৯ ধরা হয়নি: তাহলে ৪০% সীমায় ৳৪৯–৫৭ হাজারের আনঅফিসিয়াল দাম বাদ পড়ত।
- **Pixel:** `officialPrice` `null`, কিন্তু Star Tech, Gadget & Gear আর Sumash-এর "(Official)" পাতা ১ বছর অফিসিয়াল ওয়ারেন্টি লেখে, তাই সেই দামগুলো `official`।
- **Star Tech:** পুরনো Mac, iPhone 15/16, S25/Fold7/A36, Pixel 9a/10a-র পাতা "To be announced"; parser তবু SEO বাক্য থেকে পুরনো দাম পায় (উপরে ল্যাপটপ অংশের দুর্বলতা), তাই এসব পাতা অফার হিসেবে নেওয়া হয়নি, শুধু `specsSource`।
- **বাদ:** iPhone 13 (২ দোকানে স্টক), Galaxy S24 Plus আর A06 5G (কোথাও স্টক নেই), M06/M07/M16/M35/M56 (৩ দোকান হয়নি), Honor Pad X9, MatePad SE 11 (সাইজ অস্পষ্ট), Lenovo Tab M11/Tab Plus/Idea Tab Pro, Realme Pad 2। পাতা ধরে বাদ: ৳১০,০০০ বা ৳০ placeholder, বুকিং ফি, ছোট কনফিগের চেয়ে কম দামের বড় কনফিগ, "LTE" লেখা অপশন (worker "cellular" খোঁজে), কিবোর্ড/পেন বান্ডেল, Apple Gadgets-এর China/refurbished/used অপশন।
- **নতুন দোকান ক্যাটালগে:** CustomMacBD, iStockBD, MacZen BD, HNS Tech, MC Solution (Mac পাতা "International Warranty", তাই unofficial), PCB Store; সবই আগে থেকে worker-এ ছিল।
- **২ দোকানেই চলবে (মালিকের সিদ্ধান্ত, একই দিন):** পণ্যে দামসহ ২টা আলাদা দোকান থাকলেই নেওয়া (স্টক আউট দামও গোনা)। তাই আরও ১৯টা: iPhone 13, iPhone 14 Plus; Galaxy S24 Plus, A06 5G, M06 5G, M07, M16 5G, M17e 5G, M35 5G, M56 5G; Pixel 9 Pro Fold, Redmi 15 5G, POCO X7, POCO M7 Plus, OnePlus 13T, Nothing Phone 3a Lite; Honor Pad X9, Lenovo Tab M11, OnePlus Pad Go। মোট ১৩৩ পণ্য, ৩৬২ ভার্সন, ১,৫৮৮ দাম।
- **তবুও বাদ (২ দোকানও নেই):** iPhone 13 mini (একটাই আসল দাম), Lenovo Idea Tab Pro (শুধু Kry; Dazzle-এরটা পেন-বান্ডেল), Lenovo Tab Plus (কোনো দোকানে নেই), MatePad SE 11 (শুধু Dazzle; Gadget & Gear-এরটা 10.4"), Realme Pad 2 (কোথাও নেই; Pad 2 Lite শুধু Kry)। ওয়েবে এদের দাম শুধু GSMArena BD / Mobile57 / MobileDokan-এর মতো তথ্য-সাইটে, দোকানে নয়। Ryans (Cloudflare challenge) আর TechLand (403) দেখা যায়নি।
- **`sameProduct` ঠিক করা:** `SIZE_TAIL` "5g"-কে ৫ গ্রাম ধরত, তাই "Galaxy A06" আর "Galaxy A06 5G" (বা "Redmi 15" আর "Redmi 15 5G") একই পণ্য বলে build সতর্ক করত, আর অ্যাডমিনে এমন নামের পণ্য যোগ আটকাত। এখন `2g`–`5g` সাইজ নয়।
- **খেয়াল:** Arafa Telecom এখন সব পাতায় bot challenge ("One moment, please") দেয়, পুরনো ৬৩টা দাম সিঙ্ক হচ্ছে না; Sell Tech-এর ২৬টাও মিলছে না। এগুলো এই ব্যাচের নয়।

## যা নেওয়া হবে না, আর কেন

- **Daraz:** Terms of Use এর ২.E ধারায় দাম আর listing সংগ্রহ নিষেধ। affiliate চুক্তিতেও লিখিত অনুমতি ছাড়া দাম দেখানো নিষেধ।
- **Ryans:** robots.txt সব পেজ crawl করার অনুমতি দেয়, কিন্তু Cloudflare challenge দিয়ে আটকে রাখে। মালিকের সিদ্ধান্তে পুরোপুরি বাদ।
- **TechLand:** robots.txt পর্যন্ত আটকানো। বাদ।
- **Facebook group বা পেজ scrape:** নিয়মে নিষেধ, login লাগে। বাদ।
- **Google বা DuckDuckGo scrape:** bot challenge দেয়, নিয়মের বিরুদ্ধে। শুধু মাঝে মাঝে নতুন দোকান খুঁজতে ব্যবহার করা যায়।

## কঠিন নিয়ম

- bot protection, CAPTCHA, Cloudflare challenge ফাঁকি দেওয়ার কোড লেখা হবে না: stealth plugin, নকল fingerprint, residential proxy, কিছুই না। কোনো দোকান আটকালে সেই দোকান বাদ, অথবা তাদের কাছে অনুমতি বা feed চাওয়া।
- worker সবসময় নিজের পরিচয় দেওয়া user-agent ব্যবহার করবে।
- নতুন দোকান যোগের আগে তাদের Terms of Use আর robots.txt দেখে নিতে হবে।

## প্রতিযোগী

- **PC Graph** (pc-graph.onrender.com): PC যন্ত্রাংশ আর Mac, ১২টা দোকান, Ryans আর TechLand সহ। Mac এ সরাসরি প্রতিযোগী, মোবাইল আর ঘড়িতে নয়। সম্ভাব্য অংশীদার।
- **Price Monitor** (price-monitor.pro.bd): কম্পিউটার হার্ডওয়্যার।
- **MobileDokan:** মোবাইলের একটাই দাম দেখায়, দোকানভিত্তিক নয়।
- আগে ছিল, এখন বন্ধ: price.com.bd, dam.com.bd।

## আয়

- Star Tech affiliate: ৫%, bKash এ ৳১,০০০ হলে টাকা।
- পরে দোকানের কাছ থেকে "verified listing" এর জন্য টাকা।
