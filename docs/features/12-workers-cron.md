# ১২ দাম আনার worker আর cron

**অবস্থা:** 🟡 আংশিক (কোড শেষ, আসল ডেটাবেসে চলেনি)

## যা আছে

`workers/` ফোল্ডারে, GitHub Actions এ চলে (`.github/workflows/`):

| job | কী করে | কখন |
|---|---|---|
| `prices` | পরিচিত offer গুলোর দাম আবার আনা | প্রতি ৩ ঘণ্টায় |
| `js-stores` | JavaScript নির্ভর দোকান (Playwright) | দিনে দুবার |
| `discover` | দোকানের search/sitemap থেকে নতুন listing, AI দিয়ে কোন পণ্যের সাথে মেলে | প্রতি রাতে |
| `promos` | দোকানের অফার পেজ পড়া | দিনে একবার |
| `rebuild` | সাইট আবার build (SEO), থাকলে Cloudflare Pages এ deploy | প্রতি রাতে |

- প্রতিটা run `jobs.enabled` দেখে, অ্যাডমিন বন্ধ রাখলে চলে না। ফল `job_runs` আর `jobs.last_*` এ লেখে।
- দাম আনার ক্রম: দোকানের adapter → JSON-LD/itemprop/og দাম → ছাঁটা লেখা থেকে LLM।
- নিয়ম: নিজের পরিচয় দেওয়া user-agent, robots.txt মানা, প্রতি দোকানে একসাথে ২টার বেশি request নয়, 403 বা bot challenge পেলে সেই দোকান ওই run এ বাদ। কোনো stealth নেই।
- দাম ৬০% এর বেশি বদলালে প্রকাশ না করে `review_queue` এ `anomaly`। AI নিশ্চিত না হলে `match`।
- ব্যর্থ হলে Telegram সতর্কবার্তা (token থাকলে)।
- লোকাল পরীক্ষা: `npm run worker:dry` (ডেটাবেস লাগে না)।

## পরীক্ষার ফল (২০ অক্টোবর ২০২৬)

- Star Tech, Apple Gadgets, Gadget & Gear: dry run এ দাম এসেছে।
- **Pickaboo: 403 দিয়ে আটকায়।** নিয়ম অনুযায়ী বাদ থাকবে, যতক্ষণ না তারা অনুমতি দেয়।

## চালু করতে যা লাগবে

GitHub → Settings → Secrets and variables → Actions:

| নাম | কোথা থেকে |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | একই জায়গার service_role key (শুধু GitHub secret এ, কখনো ব্রাউজারে নয়) |
| `SUPABASE_PUBLISHABLE_KEY` | `rebuild` এর জন্য |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | ঐচ্ছিক, `rebuild` deploy করবে |

অ্যাডমিনের "এখনই চালান" সাথে সাথে কাজ করাতে `private_settings` এ GitHub token (README তে SQL আছে)। না দিলে পরের নির্ধারিত সময়ে চলে।

## যা বাকি

- [ ] ⛔ ডেটাবেস ([database](11-database.md))।
- [ ] GitHub এ repo push আর secret বসানো (মালিকের অনুমতিতে)।
- [ ] প্রথমবার `discover` হাতে চালিয়ে পণ্য ভরা, যাচাই বাকি পেজে মেলানো ঠিক করা।
- [ ] Private repo হলে GitHub Actions এর মাসিক ২,০০০ মিনিটের হিসাব রাখা।
- [ ] worker এর user-agent এ `https://sashroy.pages.dev/about` লিংক আছে (`workers/lib/agent.ts`), কিন্তু সাইটে `/about/` পেজ নেই। bot কে, কীভাবে যোগাযোগ করবেন, সেই পেজ বানাতে হবে।
- [ ] Pickaboo আর পরে Ryans/TechLand এর কাছে allowlist বা product feed চাওয়া।
