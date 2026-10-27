# দরদাম: প্রজেক্ট ইনডেক্স

বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম পাশাপাশি দেখানোর PWA। নাম **দরদাম** (Dordam), slogan "আগে দাম যাচাই, তারপর স্মার্ট কেনা"। এখন মোবাইল, ল্যাপটপ, ট্যাবলেট, ডেস্কটপ, স্মার্টওয়াচ, অডিও, পাওয়ার ব্যাংক, মনিটর, চার্জার, চার্জার ফ্যান, পানির ফিল্টার, মেকআপ, স্কিনকেয়ার, স্নিকার্স আর বেবি পণ্য; পরে অন্য পণ্যও আসবে।

এই ফোল্ডার মানুষ আর AI এজেন্ট দুজনের জন্য। কাজ শুরুর আগে এই ফাইল, তারপর যে ফিচারে কাজ করবেন তার ফাইল পড়ুন। কাজ শেষে সেই ফাইলের টাস্ক টিক দিন আর নিচের ট্র্যাকারে স্ট্যাটাস বদলান।

**চিহ্ন:** ✅ শেষ · 🟡 আংশিক · ⛔ আটকে আছে · ⬜ শুরু হয়নি

## এখনই যা করতে হবে

Supabase, Cloudflare আর ডোমেইনে চালু করার পুরো ধাপ: **[setup-guide.md](setup-guide.md)**

ফ্রি সার্ভিসের সীমা আর কবে শেষ হতে পারে: **[free-tier-limits.md](free-tier-limits.md)**

নতুন পণ্য বা দোকান যোগের নিয়ম: আগে **[strict-rules.md](strict-rules.md)** (কঠোর নিয়ম, বাধ্যতামূলক), তারপর **[adding-products.md](adding-products.md)** (ধাপে ধাপে)

1. ✅ **Supabase প্রজেক্ট** `fwcmpzdsbdbslollqxjk` খোলা, ৬টা migration চলেছে, `seed.sql` চালানো হয়েছে (`npx supabase db push --include-seed`)।
1a. ✅ migration `20261021150000_catalog-settings-sync.sql` চালানো (২৩ অক্টোবর যাচাই) (`npm run db:push`): ক্যাটাগরির ভেতরের ভাগ (`parent`), ডেস্কটপ/অডিও/ইয়ারবাড/হেডফোন, আর নতুন সেটিংস (English slogan, About লেখা, দেশের নোট)। আগের migration ফাইলে এগুলো পরে যোগ হয়েছিল, তাই আগে push হয়ে থাকলে ডেটাবেসে নেই; এই migration নিরাপদে দুটোই সামলায়। seed ও বসানো আছে (ক্যাটালগ ফাইল থেকে এখন ২৪৬ পণ্য, ১,৪১৯ দাম, ১৪ ক্যাটাগরি; ২৬ অক্টোবর অডিওতে নেকব্যান্ড ২৬ পণ্য, ১১৭ দাম (প্রতিটা ২+ দোকানে, ২২টা ৩+; seed এখনো চালানো হয়নি); ২৫ অক্টোবর ল্যাপটপে HP ProBook 460 G11 আর ThinkPad E14 Gen 6/Gen 7 — ৩ পণ্য, ১১ ভার্সন, ১৮ দাম, part number মিলিয়ে (L14/X1 Carbon-এ দাম-সহ ৩ দোকান নেই, কারণ data-sources-এ); ২৬ অক্টোবর ডেস্কটপে আরও ২ পণ্য, ৬ দাম — ৩+ দোকান শর্তে বাজারে এটুকুই; ২৫ অক্টোবর ডেস্কটপে Windows ব্র্যান্ড টাওয়ার ৫ পণ্য, ২৮ দাম যোগ হয়েছে — সাথে Apple-এর ৪টা; আর চার্জার ৫ পণ্য, ২৬ দাম ও চার্জার ফ্যান ৯ পণ্য, ৪৪ দাম, প্রতিটা ৪+ দোকানে, দেখুন [data-sources](features/17-data-sources.md); আগের হিসাব: স্কিনকেয়ার ২৯ পণ্য, ১০৮ দাম; পাওয়ার ব্যাংক ১৩ পণ্য, ২৫ দাম; স্নিকার্স ২০ পণ্য, ৭০ দাম; মনিটর ১২ পণ্য, ২৫ দাম)।
1b. ✅ migration `20261021160000_category-axes-slug.sql` চালানো; laptop/desktop এর cpu/gpu একবার হারিয়ে ছিল, `20261022190312_category-axes-reenable.sql` দিয়ে আবার বসানো (২৩ অক্টোবর) (উপরের সাথে একসাথে `npm run db:push` হলেই হবে): ভার্সনের ঘরের তালিকা ৭ থেকে ১২টা (gpu, cpu, resolution, battery, capacity), ল্যাপটপ/ডেস্কটপে gpu/cpu চালু, আর `categories.slug` বদলানো আটকানোর trigger। `20261023_add_wattage_axis.sql`-এ ১৩তম ঘর `wattage` (চার্জার); ২৫ অক্টোবর থেকে অ্যাপ কোডও এটা চেনে (লেবেল "ওয়াট", `20W` পার্স, সংখ্যা-ক্রম)। কোড এরই মধ্যে নতুন ঘর আর অ্যাডমিন ফর্ম (ট্যাব-ধরে নাম, আইকন বাছাই, মূল ভাগ) সাপোর্ট করে।
2. ⬜ নিজেকে অ্যাডমিন বানানো, Authentication এর সেটিং আর Turnstile secret। দেখুন [setup-guide](setup-guide.md) ধাপ ১ আর ৮।
3. ✅ GitHub secret/variable বসানো; Cloudflare Pages প্রজেক্ট `dordam` খোলা।
4. ✅ প্রথম deploy হয়েছে, সাইট `https://dordam.app` এ চালু (`https://dordam.pages.dev` ও খোলে)।
5. ⬜ অ্যাডমিনে AI সেটিংস, তারপর `prices` আর `discover` একবার হাতে চালিয়ে বার্তা দেখা। দেখুন [workers](features/12-workers-cron.md)
6. ✅ **ডোমেইন** `dordam.app` চালু: nameserver Cloudflare এ, Pages এ custom domain, `www.dordam.app` → `dordam.app`। দেখুন [setup-guide ধাপ ৫](setup-guide.md)।
7. ✅ GitHub Variable `SITE_URL = https://dordam.app` আর `rebuild` হয়েছে; live canonical, `robots.txt`, `sitemap.xml` এখন `dordam.app`।
8. ⬜ Supabase → Authentication → URL Configuration: Site URL `https://dordam.app`, Redirect `https://dordam.app/admin/`। Turnstile widget এ `dordam.app` আছে ✅।
9. ✅ Google Search Console: Domain property `dordam.app` যাচাই (২৬ অক্টোবর, "Domain name provider" দিয়ে, Cloudflare এ Google এর বসানো TXT রেকর্ড, মুছবেন না)। `sitemap.xml` জমা, Success, ৭৩৪ পেজ পাওয়া গেছে।
10. ⬜ অ্যাডমিন → সেটিংস: যোগাযোগের ইমেইল/ফোন, About পাতার লেখা, দেশের নোট মিলিয়ে নেওয়া। অ্যাডমিন → পণ্য: দোকানের দামে দেশের নাম এক রকম করা (যেমন "Japan/Middle East" → "Japan")।
12. ⬜ **২৫ অক্টোবরের নিরাপত্তা কাজ লাইভে নেওয়া, এই ক্রমেই** (উল্টো ক্রমে করলে দাম জানানো আর অ্যাডমিনের AI সেটিংস ভাঙবে; `main` এ push করলেই `rebuild` deploy করে, তাই git push সবার শেষে):
    1. Cloudflare → Turnstile এর secret key দিয়ে: `npx supabase secrets set TURNSTILE_SECRET=...`
    2. `npx supabase functions deploy submit-price` (JWT যাচাই `config.toml` এ বন্ধ, Turnstile ফাংশন নিজে দেখে)।
    3. `npm run db:push` (২৬ অক্টোবরের `20261026160000_hidden-product-read.sql` ও এতে যায়: লুকানো পণ্যের ভার্সন/দাম REST এ বন্ধ)। "inserted before the last migration" ধরনের আপত্তি এলে `npx supabase db push --include-all` (পুরনো `20261023_add_wattage_axis.sql` নিরাপদে আবার চলতে পারে)।
    4. SQL Editor এ GitHub token Vault এ: `select vault.create_secret('<token>', 'github_token');` তারপর `update private_settings set value = value #- '{github,token}';`। token টা শুধু এই repo র `Actions: write` scope এর fine-grained হলে ভালো।
    4b. Cloudflare → Pages প্রজেক্ট → Settings → Variables and Secrets (Production): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, আর secret `PROXY_KEY` (`openssl rand -hex 32`)। এগুলো ছাড়া `/api/track`, `/api/alerts` 503 দেবে (সাইট চলবে, শুধু ভিজিট গোনা আর alert বন্ধ)।
    5. তারপর git push (deploy)। CSP এখন শুধু `fwcmpzdsbdbslollqxjk.supabase.co` এ যেতে দেয়; Supabase এর custom domain ব্যবহার করলে `public/_headers` এ সেটা বসান।
    6. deploy এর পর: দাম জানানো একবার পাঠিয়ে দেখা, আর `rate_limits` এ `views:ip` সারি আসছে কিনা।
    7. সব ঠিক চললে SQL Editor এ `select vault.create_secret('<PROXY_KEY এর মান>', 'proxy_key');` — এরপর থেকে `page_views`/`watch_prices` শুধু সাইটের Function দিয়ে, সরাসরি Supabase এ নয়। (Vault আগে আর Pages secret পরে দিলে মাঝের সময়ে ভিজিট আর alert চুপচাপ বাদ পড়বে, ক্ষতি নেই।) ঐচ্ছিক: Security → WAF → Rate limiting rule, পথ `/api/`, IP ধরে ১০ সেকেন্ডে ৩০।
13. ⬜ **২৬ অক্টোবরের দামের ধরন আর স্নিকার্স লাইভে নেওয়া, এই ক্রমে:** `npm run db:push` (দুটো migration: `20261026100000_category-conditions.sql` তারপর `20261026100100_sneakers-replica.sql` — দ্বিতীয়টা পুরনো ২০টা স্নিকার্স মোছে), সাথে সাথে `npx supabase db query --linked -f supabase/seed.sql` (নতুন নামে স্নিকার্স, নেকব্যান্ড, রাউটার আর মধু/খেজুর বসে; মধু-খেজুরের ক্যাটাগরি `20261026140000_honey-dates-categories.sql`-এ; রাউটারের `20261026110000_router-category.sql` একই push-এ চলে), তারপর deploy। seed না চালালে মাঝের সময়ে সাইটে স্নিকার্স থাকবে না। দেখুন [data-sources](features/17-data-sources.md)।
14. ✅ **মেকআপ লাইভে নেওয়া (২৬ অক্টোবর migration আর seed চালানো):** `npm run db:push` (migration `20261026120100_makeup-verify-note.sql`: `makeup` ক্যাটাগরি আর `verify_note` কলাম, কন্ডিশনের migration-এর পরে চলে), তারপর seed (১৮ পণ্য, ১৭০ দাম, নতুন দোকান Beauty Booth, ALZAK, BD Amajan Shop, UK Direct BD, Skin Revive BD), তারপর `rebuild`। দেখুন [data-sources](features/17-data-sources.md)।
13. ✅ **পানির ফিল্টার লাইভে নেওয়া (২৬ অক্টোবর migration আর seed চালানো):** `npm run db:push` (migration `20261026054934_water-purifier-category.sql`, ক্যাটাগরি আগে লাগে), তারপর `npx supabase db query --linked -f supabase/seed.sql` (৭ পণ্য, ২৩ দাম, নতুন দোকান MK Electronics আর Othoba), তারপর `rebuild`। দেখুন [data-sources](features/17-data-sources.md)।
15. ⬜ **২৬ অক্টোবরের মোবাইল/ট্যাবলেট কাজ লাইভে নেওয়া, এই ক্রমে** (Honor, Tecno, Infinix, Motorola-র ৩৪ পণ্য; ১টা দোকানের ১২টা পণ্যে নতুন দাম; নতুন দোকান Arafa Telecom আর Mobile Buzz BD): (১) `workers/probe.ts` push করে GitHub Actions-এর `probe-stores` পাস দেখা, (২) `npm run db:push` (migration `20261026150000_tablet-variant-labels.sql`, ট্যাবলেটের "Standard" ভার্সনের নাম বদলায়), (৩) `npx supabase db query --linked -f supabase/seed.sql`, (৪) `rebuild`। Motorola-র অফিসিয়াল দাম খালি (বাংলাদেশে অফিসিয়াল বিক্রি নেই)। দেখুন [data-sources](features/17-data-sources.md)।
16. ✅ **২৭ অক্টোবরের বেবি পণ্য লাইভে নেওয়া (২৭ অক্টোবর migration, seed, deploy হয়েছে; `probe-stores`-এ eFamas খোলে):** (১) `npm run db:push` (migration `20261027100000_baby-categories.sql`: `baby`, তার ভেতরে `diapers` আর `baby-care`; ক্যাটাগরি seed-এর আগে লাগে), (২) `workers/probe.ts` push করে `probe-stores`-এ নতুন দোকান eFamas পাস দেখা, (৩) `npx supabase db query --linked -f supabase/seed.sql` (২৭ পণ্য, ২১৮ দাম, প্রতিটা ভার্সন ২+ দোকানে), (৪) `rebuild`। দেখুন [data-sources](features/17-data-sources.md)।
11. ✅ `/about/` পেজ (`/about/` বাংলা, `/en/about/` English), সব লেখা অ্যাডমিন থেকে বদলানো যায়।

## ফিচার ট্র্যাকার

| # | ফিচার | অবস্থা | ফাইল |
|---|---|---|---|
| 1 | ডিজাইন সিস্টেম (রং, কম্পোনেন্ট) | ✅ | [01-design-system](features/01-design-system.md) |
| 2 | ইউজার পেজ (হোম, পণ্য, বিক্রেতা, সেভ) | ✅ ডিল ফিড, "একই ধরনের আরও সস্তা", পণ্যের হিরো কার্ড কমপ্যাক্ট | [02-user-pages](features/02-user-pages.md) |
| 3 | খোঁজা আর ফিল্টার | ✅ | [03-search](features/03-search.md) |
| 4 | বিক্রেতা, ফোন নম্বর, যাচাই ব্যাজ | ✅ | [04-sellers](features/04-sellers.md) |
| 5 | ক্রেতার পাঠানো দাম | 🟡 | [05-price-reports](features/05-price-reports.md) |
| 6 | বাংলা/English আর লাইট/ডার্ক | ✅ | [06-i18n-theme](features/06-i18n-theme.md) |
| 7 | PWA (অ্যাপ নামানো, অফলাইন) | 🟡 | [07-pwa](features/07-pwa.md) |
| 8 | SEO | 🟡 | [08-seo](features/08-seo.md) |
| 9 | অ্যাডমিন প্যানেল | ✅ | [09-admin-panel](features/09-admin-panel.md) |
| 10 | লগইন | ⛔ | [10-auth](features/10-auth.md) |
| 11 | ডেটাবেস (Supabase) | ⛔ | [11-database](features/11-database.md) |
| 12 | দাম আনার worker আর cron | 🟡 মেলানো নির্ভুল করা হয়েছে (২৭ অক্টোবর: মডেল নম্বর, পণ্যের ধরন, Shopify, part number, AI বন্ধে আন্দাজ নয়) | [12-workers-cron](features/12-workers-cron.md) |
| 13 | AI (OpenAI-compatible LLM) | 🟡 | [13-llm](features/13-llm.md) |
| 14 | ভিজিটর গোনা আর লগ | 🟡 | [14-analytics-logs](features/14-analytics-logs.md) |
| 15 | দোকানের জন্য Telegram bot | ⬜ | [15-telegram-bot](features/15-telegram-bot.md) |
| 16 | Deploy আর ডোমেইন | 🟡 `dordam.app` চালু, SEO লিংক ঠিক; Auth URL, Search Console বাকি | [16-deploy](features/16-deploy.md) |
| 17 | ডেটার উৎস আর নিয়ম | ✅ সিদ্ধান্ত | [17-data-sources](features/17-data-sources.md) |
| 18 | নিরাপত্তা | 🟡 ড্যাশবোর্ড সেটিং বাকি | [18-security](features/18-security.md) |

## পুরো প্ল্যান সংক্ষেপে

- **কী:** একই পণ্যের দাম কয়েকটা দোকান থেকে এনে পাশাপাশি দেখানো। যে দোকানের ওয়েবসাইট নেই (মার্কেটের দোকান, ফেসবুক গ্রুপ), তাদের ফোন নম্বর আর "যাচাই করা / যাচাই হয়নি" ব্যাজ দেখানো।
- **ক্যাটাগরি:** অ্যাডমিন থেকে বানানো যায় (`categories` টেবিল, ভেতরে ভাগও)। এখন মোবাইল, ল্যাপটপ, ট্যাবলেট, ডেস্কটপ, স্মার্টওয়াচ, অডিও (ইয়ারবাড, হেডফোন), পাওয়ার ব্যাংক, মনিটর, চার্জার, চার্জার ফ্যান, পানির ফিল্টার, মেকআপ, স্কিনকেয়ার, স্নিকার্স আর বেবি পণ্য (ডায়াপার, বেবি কেয়ার)। Apple আলাদা ভাগ নয়, ব্র্যান্ড।
- **দোকান:** Star Tech, Gadget & Gear, Apple Gadgets, Sumash Tech, Kry International, Executive Machines, Motion View, Dazzle, Diamu, Gadget Breeze, MacZen BD, Three's, Splayd, Ragen, DOB Skateshop, Sneaker Zone, Trek N Tread, SneakersBD Official, Global Brand, MC Solution, PCB Store, Sell Tech, MK Electronics, Othoba, Beauty Booth, ALZAK, BD Amajan Shop, UK Direct BD, Skin Revive BD, Shei Tech, Dolbear, BabyCare, Zapatos; স্কিনকেয়ারে Shajgoj, Arogga, Chaldal, BanglaShoppers, MedEasy, EmartWay, Beauty Line, Emart, Aromyeo, Korean Care, Skincare Shop, Cosmetics Corner, IndianMartBD, Beprincess, Color World, Glowella, OHSOGO, Chardike, Perfecto, Korean Mart BD, Klassy Missy, Lira Import, Her Happy Skin (কোনটা কীসের জন্য: [data-sources](features/17-data-sources.md))। এর বাইরে ক্রেতার পাঠানো দাম আর (পরে) Telegram bot। Pickaboo আর GadStyle আমাদের bot আটকায়, Rokomari আর The Mall BD GitHub Actions থেকে আটকায়, তাই বাদ; Choice Legacy-র পণ্যের পাতায় রেট লিমিট (~১ অনুরোধ/মিনিট), তাই বাদ।
- **বাদ:** Daraz (তাদের Terms এ দাম সংগ্রহ নিষেধ), Ryans আর TechLand, Facebook scrape। bot protection ফাঁকি দেওয়ার কোড লেখা হবে না, robots.txt মানা হয়।
- **সব ফ্রি:** Next.js static export, Cloudflare Pages, Supabase ফ্রি tier, GitHub Actions; AI এর জন্য মালিকের নিজের OpenAI-compatible সাবস্ক্রিপশন।
- **আয় (পরে):** Star Tech affiliate (৫%), দোকানের "verified listing"।

## স্ট্যাক

| অংশ | কী |
|---|---|
| ফ্রন্টএন্ড | Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 4, lucide-react |
| ডেটা | Supabase (Postgres + Auth + RLS), ব্রাউজার থেকে সরাসরি `@supabase/supabase-js`; শুরুর আসল পণ্য আর দাম `data/catalog/*.json` থেকে `supabase/seed.sql` |
| worker | `workers/` (Node + tsx), GitHub Actions এ চলে |
| AI | যেকোনো OpenAI-compatible API, ঠিকানা আর key অ্যাডমিন সেটিংসে |
| হোস্টিং | Cloudflare Pages (static `out/` ফোল্ডার), ডোমেইন `dordam.app` (nameserver Cloudflare এ, `www` → apex) |

Supabase যুক্ত না থাকলে পুরো অ্যাপ `src/data/sample.ts` এর নমুনা ডেটায় চলে, অ্যাডমিন "ডেমো মোডে" খোলে।

## এজেন্টদের জন্য নিয়ম

- **ফোল্ডার:** `src/app` (রুট আর `*View.tsx`), `src/components/{ui,layout,product,seller,search,forms,admin}`, `src/hooks`, `src/services` (+ `services/admin`), `src/lib` (side effect), `src/utils` (pure ফাংশন), `src/config`, `src/types`, `src/data`, `src/i18n`। নতুন কোড এই কাঠামোতেই।
- **স্টাইল:** অপ্রয়োজনীয় কমেন্ট নয়, ছোট আর এক কাজের ফাইল, অর্থবহ নাম।
- **Next.js 16:** অপরিচিত API ব্যবহারের আগে `node_modules/next/dist/docs/` পড়ুন। static export, তাই server action বা runtime API route নেই।
- **লেখা:** ইউজারের দেখা সব লেখা `src/i18n/bn.ts` আর `en.ts` এ। স্বাভাবিক বাংলা লিখুন, "·" বা "—" দিয়ে লেবেল জোড়া দেবেন না। প্রতিটা পেজে "আমরা কীভাবে কাজ করি" ধরনের ব্যাখ্যা দেবেন না।
- **ডিজাইন:** কার্ড, চিপ, আইকন রাখুন। রং `src/app/globals.css` এর টোকেন থেকে নিন, হার্ডকোড হেক্স নয়। ডিফল্ট লাইট মোড আর বাংলা।
- **ডেটাবেস:** পুরনো migration বদলাবেন না, `npm run db:new` দিয়ে নতুন বানান।
- **চেক:** কাজ শেষে `npm run typecheck`, `npm run lint`, `npm run build`। UI বদলালে `npm run dev` (পোর্ট 3100) চালিয়ে ব্রাউজারে দেখুন।
- **পোর্ট:** এই প্রজেক্ট `3100` এ চলে। `3000` এ মালিকের অন্য প্রজেক্ট চলে।
- **ঝুঁকির কাজ:** commit, push, deploy, Supabase এ লেখা মালিকের অনুমতি ছাড়া নয়।

## পুরনো প্রজেক্ট

আগে এই repo তে "পথঘাট" ছিল। পুরো কোড লোকাল branch `archive/pothghat` এ রাখা আছে। তার লাইভ সাইট (pothghat.pages.dev) আর Supabase প্রজেক্ট `zoodmqxxbevlhepwoyjt` এখনো চালু, এই প্রজেক্ট থেকে ওগুলো ছোঁয়া যাবে না। পুরনো `.env.local` এখন `.env.local.pothghat` নামে আছে।

## কমান্ড

| কাজ | কমান্ড |
|---|---|
| ডেভ সার্ভার | `npm run dev` (launch.json এ পোর্ট 3100) |
| বিল্ড | `npm run build` (ফল `out/` এ) |
| টাইপ আর লিন্ট | `npm run typecheck`, `npm run lint` |
| নতুন migration | `npm run db:new <নাম>` |
| migration চালানো | `npm run db:push` |
| worker পরীক্ষা (DB ছাড়া) | `npm run worker:dry` |
| সব দাম সিঙ্ক হয় কি না (DB ছাড়া) | `npm run worker:check` |
| ব্লক হওয়া দোকান AI দিয়ে পড়া যায় কি না (DB ছাড়া, Gemini key লাগে) | `npm run worker:ai-check` |
| worker চালানো | `npm run worker <job>` |
| আসল ডেটার স্পেস আনা | `npm run catalog:specs` |
| আসল ডেটা থেকে নমুনা আর seed বানানো | `npm run catalog:build` |
