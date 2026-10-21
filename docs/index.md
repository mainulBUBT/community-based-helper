# দরদাম: প্রজেক্ট ইনডেক্স

বাংলাদেশের দোকানগুলো থেকে একই পণ্যের দাম পাশাপাশি দেখানোর PWA। নাম **দরদাম** (Dordam), slogan "আগে দাম যাচাই, তারপর স্মার্ট কেনা"। এখন মোবাইল, ল্যাপটপ, ট্যাবলেট, ডেস্কটপ, স্মার্টওয়াচ আর অডিও; পরে অন্য পণ্যও আসবে।

এই ফোল্ডার মানুষ আর AI এজেন্ট দুজনের জন্য। কাজ শুরুর আগে এই ফাইল, তারপর যে ফিচারে কাজ করবেন তার ফাইল পড়ুন। কাজ শেষে সেই ফাইলের টাস্ক টিক দিন আর নিচের ট্র্যাকারে স্ট্যাটাস বদলান।

**চিহ্ন:** ✅ শেষ · 🟡 আংশিক · ⛔ আটকে আছে · ⬜ শুরু হয়নি

## এখনই যা করতে হবে

Supabase, Cloudflare আর ডোমেইনে চালু করার পুরো ধাপ: **[setup-guide.md](setup-guide.md)**

নতুন পণ্য বা দোকান যোগের নিয়ম: **[adding-products.md](adding-products.md)**

1. ✅ **Supabase প্রজেক্ট** `fwcmpzdsbdbslollqxjk` খোলা, ৬টা migration চলেছে, `seed.sql` চালানো হয়েছে (`npx supabase db push --include-seed`)।
1a. ⬜ নতুন migration `20261021150000_catalog-settings-sync.sql` চালানো (`npm run db:push`): ক্যাটাগরির ভেতরের ভাগ (`parent`), ডেস্কটপ/অডিও/ইয়ারবাড/হেডফোন, আর নতুন সেটিংস (English slogan, About লেখা, দেশের নোট)। আগের migration ফাইলে এগুলো পরে যোগ হয়েছিল, তাই আগে push হয়ে থাকলে ডেটাবেসে নেই; এই migration নিরাপদে দুটোই সামলায়। তারপর `supabase/seed.sql` আবার চালান (SQL Editor এ, বা `npx supabase db push --include-seed`): এখন এতে ৫৩টা পণ্য আর ৫৪৫টা দাম (iPhone, iPad, Mac, অডিও সহ); আগে থেকে যা আছে তা দুবার ঢোকে না।
1b. ⬜ নতুন migration `20261021160000_category-axes-slug.sql` চালানো (উপরের সাথে একসাথে `npm run db:push` হলেই হবে): ভার্সনের ঘরের তালিকা ৭ থেকে ১২টা (gpu, cpu, resolution, battery, capacity), ল্যাপটপ/ডেস্কটপে gpu/cpu চালু, আর `categories.slug` বদলানো আটকানোর trigger। কোড এরই মধ্যে নতুন ঘর আর অ্যাডমিন ফর্ম (ট্যাব-ধরে নাম, আইকন বাছাই, মূল ভাগ) সাপোর্ট করে।
2. ⬜ নিজেকে অ্যাডমিন বানানো, Authentication এর সেটিং আর Turnstile secret। দেখুন [setup-guide](setup-guide.md) ধাপ ১ আর ৮।
3. ✅ GitHub secret/variable বসানো; Cloudflare Pages প্রজেক্ট `dordam` খোলা।
4. ✅ প্রথম deploy হয়েছে, সাইট `https://dordam.app` এ চালু (`https://dordam.pages.dev` ও খোলে)।
5. ⬜ অ্যাডমিনে AI সেটিংস, তারপর `prices` আর `discover` একবার হাতে চালিয়ে বার্তা দেখা। দেখুন [workers](features/12-workers-cron.md)
6. ✅ **ডোমেইন** `dordam.app` চালু: nameserver Cloudflare এ, Pages এ custom domain, `www.dordam.app` → `dordam.app`। দেখুন [setup-guide ধাপ ৫](setup-guide.md)।
7. ✅ GitHub Variable `SITE_URL = https://dordam.app` আর `rebuild` হয়েছে; live canonical, `robots.txt`, `sitemap.xml` এখন `dordam.app`।
8. ⬜ Supabase → Authentication → URL Configuration: Site URL `https://dordam.app`, Redirect `https://dordam.app/admin/`। Turnstile widget এ `dordam.app` আছে ✅।
9. ⬜ Google Search Console (Domain property `dordam.app`, Cloudflare DNS এ TXT) এ সাইট যোগ আর `sitemap.xml` জমা, ৭ এর পরে।
10. ⬜ অ্যাডমিন → সেটিংস: যোগাযোগের ইমেইল/ফোন, About পাতার লেখা, দেশের নোট মিলিয়ে নেওয়া। অ্যাডমিন → পণ্য: দোকানের দামে দেশের নাম এক রকম করা (যেমন "Japan/Middle East" → "Japan")।
11. ✅ `/about/` পেজ (`/about/` বাংলা, `/en/about/` English), সব লেখা অ্যাডমিন থেকে বদলানো যায়।

## ফিচার ট্র্যাকার

| # | ফিচার | অবস্থা | ফাইল |
|---|---|---|---|
| 1 | ডিজাইন সিস্টেম (রং, কম্পোনেন্ট) | ✅ | [01-design-system](features/01-design-system.md) |
| 2 | ইউজার পেজ (হোম, পণ্য, বিক্রেতা, সেভ) | ✅ | [02-user-pages](features/02-user-pages.md) |
| 3 | খোঁজা আর ফিল্টার | ✅ | [03-search](features/03-search.md) |
| 4 | বিক্রেতা, ফোন নম্বর, যাচাই ব্যাজ | ✅ | [04-sellers](features/04-sellers.md) |
| 5 | ক্রেতার পাঠানো দাম | 🟡 | [05-price-reports](features/05-price-reports.md) |
| 6 | বাংলা/English আর লাইট/ডার্ক | ✅ | [06-i18n-theme](features/06-i18n-theme.md) |
| 7 | PWA (অ্যাপ নামানো, অফলাইন) | 🟡 | [07-pwa](features/07-pwa.md) |
| 8 | SEO | 🟡 | [08-seo](features/08-seo.md) |
| 9 | অ্যাডমিন প্যানেল | ✅ | [09-admin-panel](features/09-admin-panel.md) |
| 10 | লগইন | ⛔ | [10-auth](features/10-auth.md) |
| 11 | ডেটাবেস (Supabase) | ⛔ | [11-database](features/11-database.md) |
| 12 | দাম আনার worker আর cron | 🟡 | [12-workers-cron](features/12-workers-cron.md) |
| 13 | AI (OpenAI-compatible LLM) | 🟡 | [13-llm](features/13-llm.md) |
| 14 | ভিজিটর গোনা আর লগ | 🟡 | [14-analytics-logs](features/14-analytics-logs.md) |
| 15 | দোকানের জন্য Telegram bot | ⬜ | [15-telegram-bot](features/15-telegram-bot.md) |
| 16 | Deploy আর ডোমেইন | 🟡 `dordam.app` চালু, SEO লিংক ঠিক; Auth URL, Search Console বাকি | [16-deploy](features/16-deploy.md) |
| 17 | ডেটার উৎস আর নিয়ম | ✅ সিদ্ধান্ত | [17-data-sources](features/17-data-sources.md) |
| 18 | নিরাপত্তা | 🟡 ড্যাশবোর্ড সেটিং বাকি | [18-security](features/18-security.md) |

## পুরো প্ল্যান সংক্ষেপে

- **কী:** একই পণ্যের দাম কয়েকটা দোকান থেকে এনে পাশাপাশি দেখানো। যে দোকানের ওয়েবসাইট নেই (মার্কেটের দোকান, ফেসবুক গ্রুপ), তাদের ফোন নম্বর আর "যাচাই করা / যাচাই হয়নি" ব্যাজ দেখানো।
- **ক্যাটাগরি:** অ্যাডমিন থেকে বানানো যায় (`categories` টেবিল, ভেতরে ভাগও)। এখন মোবাইল, ল্যাপটপ, ট্যাবলেট, ডেস্কটপ, স্মার্টওয়াচ, অডিও (ইয়ারবাড, হেডফোন)। Apple আলাদা ভাগ নয়, ব্র্যান্ড।
- **দোকান:** Star Tech, Gadget & Gear, Apple Gadgets, Sumash Tech, Kry International, Executive Machines, Motion View, Dazzle, Diamu, Gadget Breeze, MacZen BD (কোনটা কীসের জন্য: [data-sources](features/17-data-sources.md))। এর বাইরে ক্রেতার পাঠানো দাম আর (পরে) Telegram bot। Pickaboo আর GadStyle আমাদের bot আটকায়, তাই বাদ।
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
