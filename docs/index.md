# সাশ্রয়: প্রজেক্ট ইনডেক্স

বাংলাদেশের দোকানগুলোতে মোবাইল, Apple (iPhone, MacBook, iPad) আর স্মার্টওয়াচের দাম পাশাপাশি দেখানোর PWA। নাম "সাশ্রয়" আপাতত, পরে বদলাতে পারে।

এই ফোল্ডার মানুষ আর AI এজেন্ট দুজনের জন্য। কাজ শুরুর আগে এই ফাইল, তারপর যে ফিচারে কাজ করবেন তার ফাইল পড়ুন। কাজ শেষে সেই ফাইলের টাস্ক টিক দিন আর নিচের ট্র্যাকারে স্ট্যাটাস বদলান।

**চিহ্ন:** ✅ শেষ · 🟡 আংশিক · ⛔ আটকে আছে · ⬜ শুরু হয়নি

## এখনই যা করতে হবে

Supabase, Cloudflare আর ডোমেইনে চালু করার পুরো ধাপ: **[setup-guide.md](setup-guide.md)**

1. ⛔ **Supabase প্রজেক্ট খোলা।** CLI দিয়ে নতুন প্রজেক্ট খুলতে গেলে "Forbidden" আসে। এই মেশিনের CLI টোকেন সম্ভবত শুধু পুরনো পথঘাট প্রজেক্টের জন্য। মালিককে `npx supabase login` আবার চালাতে হবে, অথবা supabase.com থেকে নিজে প্রজেক্ট খুলে ref দিতে হবে। বিস্তারিত: [database](features/11-database.md)
2. ⬜ প্রজেক্ট খোলার পর migration চালানো, `.env.local` এ key বসানো, মালিককে অ্যাডমিন বানানো। দেখুন [auth](features/10-auth.md)
3. ⬜ worker গুলো আসল ডেটাবেসে একবার চালিয়ে দেখা। দেখুন [workers](features/12-workers-cron.md)
4. ⬜ Cloudflare Pages এ নতুন প্রজেক্টে deploy। দেখুন [deploy](features/16-deploy.md)
5. ⬜ `/about/` পেজ বানানো। worker এর user-agent এ এর লিংক দেওয়া আছে।
6. ⬜ কিছুই commit করা হয়নি। মালিক অনুমতি দিলে `main` এ commit।

## ফিচার ট্র্যাকার

| # | ফিচার | অবস্থা | ফাইল |
|---|---|---|---|
| 1 | ডিজাইন সিস্টেম (রং, কম্পোনেন্ট) | ✅ | [01-design-system](features/01-design-system.md) |
| 2 | ইউজার পেজ (হোম, পণ্য, বিক্রেতা, সেভ) | ✅ | [02-user-pages](features/02-user-pages.md) |
| 3 | খোঁজা আর ফিল্টার | ✅ | [03-search](features/03-search.md) |
| 4 | বিক্রেতা, ফোন নম্বর, যাচাই ব্যাজ | ✅ | [04-sellers](features/04-sellers.md) |
| 5 | ক্রেতার পাঠানো দাম | 🟡 | [05-price-reports](features/05-price-reports.md) |
| 6 | বাংলা/English আর লাইট/ডার্ক | 🟡 | [06-i18n-theme](features/06-i18n-theme.md) |
| 7 | PWA (অ্যাপ নামানো, অফলাইন) | 🟡 | [07-pwa](features/07-pwa.md) |
| 8 | SEO | 🟡 | [08-seo](features/08-seo.md) |
| 9 | অ্যাডমিন প্যানেল | ✅ | [09-admin-panel](features/09-admin-panel.md) |
| 10 | লগইন | ⛔ | [10-auth](features/10-auth.md) |
| 11 | ডেটাবেস (Supabase) | ⛔ | [11-database](features/11-database.md) |
| 12 | দাম আনার worker আর cron | 🟡 | [12-workers-cron](features/12-workers-cron.md) |
| 13 | AI (OpenAI-compatible LLM) | 🟡 | [13-llm](features/13-llm.md) |
| 14 | ভিজিটর গোনা আর লগ | 🟡 | [14-analytics-logs](features/14-analytics-logs.md) |
| 15 | দোকানের জন্য Telegram bot | ⬜ | [15-telegram-bot](features/15-telegram-bot.md) |
| 16 | Deploy আর ডোমেইন | ⬜ | [16-deploy](features/16-deploy.md) |
| 17 | ডেটার উৎস আর নিয়ম | ✅ সিদ্ধান্ত | [17-data-sources](features/17-data-sources.md) |

## পুরো প্ল্যান সংক্ষেপে

- **কী:** একই পণ্যের দাম কয়েকটা দোকান থেকে এনে পাশাপাশি দেখানো। যে দোকানের ওয়েবসাইট নেই (মার্কেটের দোকান, ফেসবুক গ্রুপ), তাদের ফোন নম্বর আর "যাচাই করা / যাচাই হয়নি" ব্যাজ দেখানো।
- **ক্যাটাগরি:** মোবাইল, Apple, স্মার্টওয়াচ।
- **দোকান:** Star Tech, Pickaboo, Apple Gadgets, Gadget & Gear। এর বাইরে Telegram bot আর ক্রেতার পাঠানো দাম।
- **বাদ:** Daraz (তাদের Terms এ দাম সংগ্রহ নিষেধ), Ryans আর TechLand (bot protection), Facebook scrape। bot protection ফাঁকি দেওয়ার কোড লেখা হবে না।
- **সব ফ্রি:** Next.js static export, Cloudflare Pages, Supabase ফ্রি tier, GitHub Actions, Gemini ফ্রি tier।
- **আয় (পরে):** Star Tech affiliate (৫%), দোকানের "verified listing"।

## স্ট্যাক

| অংশ | কী |
|---|---|
| ফ্রন্টএন্ড | Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 4, lucide-react |
| ডেটা | Supabase (Postgres + Auth + RLS), ব্রাউজার থেকে সরাসরি `@supabase/supabase-js` |
| worker | `workers/` (Node + tsx), GitHub Actions এ চলে |
| AI | যেকোনো OpenAI-compatible API, ঠিকানা আর key অ্যাডমিন সেটিংসে |
| হোস্টিং | Cloudflare Pages (static `out/` ফোল্ডার) |

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
| worker চালানো | `npm run worker <job>` |
