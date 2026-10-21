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
| Motion View | sitemap | JSON-LD | ✅ |
| Gadget Breeze | WooCommerce sitemap | WooCommerce | ✅ |
| Pickaboo | `/search-result/<নাম>` HTML | | ⛔ worker কে 403 দেয় |
| Telegram এর দোকান | দোকান নিজে পাঠায় | ⬜ [telegram](15-telegram-bot.md) |
| ক্রেতা | "দাম জানান" | 🟡 [price reports](05-price-reports.md) |

## আসল ডেটা (২০২৬-১০-২১ এ জোগাড়)

৫৩টা পণ্য, ১১৫টা ভার্সন, ১০টা দোকান থেকে ৫৪৫টা দাম, সব পাতায় গিয়ে নিজে দেখা (কোনো দাম আন্দাজ করা নয়)। প্রতিটা পণ্য অন্তত ৩টা দোকানে, শুধু MacBook Pro 14" M5 Max আর Redmi Watch 6 Active ২টায় (নতুন বা দামি, আর কেউ দাম দেয়নি)।

- মোবাইল: Samsung, Xiaomi, Vivo, Realme, Oppo (StatCounter বাংলাদেশ, আগস্ট ২০২৬), প্রতিটার ২-৩টা চলতি মডেল; আর Apple: iPhone 18 Pro/Pro Max, iPhone Duo, 17 Pro/Pro Max, Air, 17, 17e, 16।
- ট্যাবলেট: iPad 11" (A16), iPad mini (A17 Pro), iPad Air 11"/13" M4, iPad Pro 11"/13" M5 (স্টোরেজ আর Wi-Fi/Cellular ধরে ভার্সন)।
- Mac: MacBook Neo, Air 13"/15" M5, Pro 14"/16" (M5, M5 Pro, M5 Max), iMac M4, Mac mini (M6, M5 Pro), Mac Studio M5 Max।
- স্মার্টওয়াচ: Apple Watch Series 11, Galaxy Watch8, Amazfit Active 2 Premium, Huawei Watch Fit 4, Redmi Watch 6 Active।
- অডিও: AirPods Pro 3, Galaxy Buds3 Pro, Sony WF-1000XM6, Soundcore P40i, CMF Buds 2 (ইয়ারবাড); Sony WH-1000XM6, WH-CH720N, JBL Tune 770NC, Soundcore Space One (হেডফোন)।

কোন দোকান কীসের জন্য ভালো:

| দোকান | সাইট | যে ভাগে | কেন |
|---|---|---|---|
| Star Tech | startech.com.bd | সব | অফিসিয়াল স্টক, পুরো স্পেসিফিকেশন টেবিল, নিয়মিত আর ছাড়ের দাম, স্টক |
| Gadget & Gear | gadgetandgear.com | সব | অফিসিয়াল/অনুমোদিত, প্রতিটা ভার্সনের আলাদা পাতা; Mac এ Apple Authorised |
| Apple Gadgets | applegadgetsbd.com | সব | অফিসিয়াল আর আনঅফিসিয়াল দুই রকম; প্রায়ই সবচেয়ে কম দাম |
| Sumash Tech | sumashtech.com | সব | অফিসিয়াল আর ইন্টারন্যাশনাল আলাদা পাতায়; কাটা দাম অনেক সময় ফোলানো |
| Kry International | kryinternational.com | মোবাইল | আনঅফিসিয়াল ভার্সনে দেশের কোড (India, Global…) |
| Dazzle | dazzle.com.bd | মোবাইল, ঘড়ি, অডিও | বেশিরভাগ আনঅফিসিয়াল, কম দামের রেফারেন্স; MRP ফোলানো |
| Diamu | diamu.com.bd | মোবাইল, ঘড়ি, অডিও | আনঅফিসিয়াল, কম কভারেজ |
| Executive Machines | executivemachines.com | Mac | Apple Authorised Reseller, দামি কনফিগও আছে, দাম সাধারণত বেশি |
| Motion View | motionview.com.bd | ঘড়ি, অডিও | Amazfit এর অনুমোদিত পরিবেশক |
| Gadget Breeze | gadgetbreeze.com.bd | ঘড়ি | ছোট দোকান, Redmi Watch 6 Active এর জন্য |

বাদ পড়েছে: Pickaboo, GadStyle, Gadget N Music (403 দেয়), Gadget Studio BD (robots.txt এ বন্ধ), Computer Source (timeout)। Mobile Dokan দোকান না, শুধু অফিসিয়াল দাম মেলাতে দেখা হয়েছে।

### কীভাবে ঢোকানো হলো

1. `data/catalog/{mobile,apple,mac,watch,audio}.json`: জোগাড় করা কাঁচা ডেটা (দোকান, পাতার লিংক, দাম, স্টক, অফিসিয়াল/আনঅফিসিয়াল, তারিখ)।
2. `npm run catalog:specs`: Star Tech এর পাতা থেকে স্পেসিফিকেশন টেবিল `data/catalog/specs.json` এ (সেকেন্ডে একটা অনুরোধ, সৎ UA)।
3. `npm run catalog:build`: `src/data/catalog.generated.ts` (Supabase ছাড়া চালালে সাইট এটা দেখায়) আর `supabase/seed.sql` (Supabase এ migration এর পরে একবার চালান) বানায়।

দামের ইতিহাস বানানো হয়নি; শুধু আজকের দাম আছে, তাই চার্ট কয়েক দিন দাম জমার পরে দেখাবে। নমুনা অফার (কার্ড/bKash) সরানো হয়েছে কারণ সেগুলো আসল ছিল না।

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
