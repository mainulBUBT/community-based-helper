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
| Her Happy Skin | নিজের JSON API (`her-api`) | ওই API-ই (`hhsVariants`) | ✅ |
| Choice Legacy | product sitemap খোলা, কিন্তু পণ্যের পাতায় ~১ অনুরোধ/মিনিট রেট লিমিট | | ⛔ নিয়মে চলে না |
| Pickaboo | `/search-result/<নাম>` HTML | | ⛔ worker কে 403 দেয় |
| Telegram এর দোকান | দোকান নিজে পাঠায় | ⬜ [telegram](15-telegram-bot.md) |
| ক্রেতা | "দাম জানান" | 🟡 [price reports](05-price-reports.md) |

## আসল ডেটা (২০২৬-১০-২১ এ জোগাড়)

৫৩টা টেক পণ্য, ১১৫টা ভার্সন, ১০টা দোকান থেকে ৫৪৫টা দাম, সব পাতায় গিয়ে নিজে দেখা (কোনো দাম আন্দাজ করা নয়)। প্রতিটা পণ্য অন্তত ৩টা দোকানে, শুধু MacBook Pro 14" M5 Max আর Redmi Watch 6 Active ২টায় (নতুন বা দামি, আর কেউ দাম দেয়নি)। পরে চার্জার/ফ্যান/মনিটর/পাওয়ার ব্যাংক আর স্কিনকেয়ার যোগ হয়ে ডেটাবেসে এখন ৯৬টা পণ্য, ৯১১টা দাম, ১৩টা ক্যাটাগরি।

- মোবাইল: Samsung, Xiaomi, Vivo, Realme, Oppo (StatCounter বাংলাদেশ, আগস্ট ২০২৬), প্রতিটার ২-৩টা চলতি মডেল; আর Apple: iPhone 18 Pro/Pro Max, iPhone Duo, 17 Pro/Pro Max, Air, 17, 17e, 16।
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
| Trek N Tread | trekntread.com | স্নিকার্স | Laravel/Inertia; দাম পাতার embedded data-তে, worker-এ আলাদা parser |
| SneakersBD Official | sneakersbdofficial.com | স্নিকার্স | `product:price:amount` মেটা থেকে দাম পার্স হয় |
| Global Brand | globalbrand.com.bd | চার্জার, মনিটর, ডেস্কটপ | LG/Asus/Lenovo-র ডিস্ট্রিবিউটর (OpenCart); পাতার JSON-LD-তে দাম |
| MC Solution | mcsolution.com.bd | ল্যাপটপ, মনিটর | WooCommerce; অফিসিয়াল ওয়ারেন্টির দোকান |
| PCB Store | pcbstore.com.bd | মনিটর, ডেস্কটপ | গেমিং/PC দোকান (Next.js); পাতার JSON ডেটায় দাম, প্রায়ই Stock out |
| Sell Tech | selltech.com.bd | ডেস্কটপ | OpenCart; brand PC-তে ভালো দাম, JSON-LD |

বাদ পড়েছে: Pickaboo, GadStyle, Gadget N Music (403 দেয়), Gadget Studio BD (robots.txt এ বন্ধ), Computer Source (timeout)। Mobile Dokan দোকান না, শুধু অফিসিয়াল দাম মেলাতে দেখা হয়েছে।

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
