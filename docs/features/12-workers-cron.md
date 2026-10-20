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

## পরীক্ষার ফল (২১ অক্টোবর ২০২৬)

- Star Tech, Apple Gadgets, Gadget & Gear: dry run এ দাম **আর ছবি** (JSON-LD `image`, fallback `og:image`) এসেছে।
- **Pickaboo: robots.txt 403** — নিয়ম অনুযায়ী বাদ।
- লোকাল ম্যাচার `8+128` ধরনের লেখা এখন বোঝে (আগে `+` কে "plus" বানিয়ে মডেল-নামের সাথে ঘাঁচত)। কাছাকাছি মডেল (Pro, Classic, 4G/5G লেখা নেই) সঠিকভাবে আটকায়।
- Apple Gadgets এর sitemap (১১,১১৩ URL) থেকে নমুনা পণ্যের আসল ছবি এনে `sample.ts` এ বসানো হয়েছে — সাইটে গ্যালারি আর কার্ডে দেখা যায়। আসল deploy এর আগে ছবি নিজেদের কাছে ক্যাশ করা উচিত।
- নমুনা offer গুলোতে এখন দোকানের সরাসরি পণ্য-লিংক আর **আসল দাম** আছে (Star Tech, Apple Gadgets, Gadget & Gear; Pickaboo robots-ব্লকড বলে হোমপেজ আর বানানো দাম)। ভার্সনের আসল দাম না পাওয়া গেলে অফিসিয়াল দামের পার্থক্য যোগ করে ধরা হয়েছে।
- ম্যাচার এখন রং-ও বোঝে: ভার্সনে রং লেখা থাকলে লিস্টিংয়ের রঙের সাথে মিলতে হয় (Black লিস্টিং Blue ভার্সন বাদ দেয়)।
- দোকানের অ্যাডাপ্টার সব আলাদা ফাইল ছিল — এখন একটাই `workers/stores/index.ts` রেজিস্ট্রি: সাধারণ দোকান শুধু ডেটা (sitemap ঠিকানা + URL প্রিফিক্স), ব্যতিক্রম (Gadget & Gear এর JS-দাম, Star Tech এর ক্যাটাগরি-হাঁটা, Pickaboo এর সার্চ) এক জায়গায় আলাদা করে লেখা।
- LLM: `.env.local` এ `LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY` দিলে ডেটাবেস ছাড়াই `npm run worker:dry` এ বিচারপতি পরীক্ষা চলে।

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
- [x] worker এর user-agent এ `https://dordam.app/about` লিংক আছে (`workers/lib/agent.ts`) — `/about/` পেজ এখন আছে (বাংলা, সাথে `/en/about/`), সেখানে bot এর পরিচয় আর যোগাযোগের তথ্য দেখানো হয়।
- [ ] Pickaboo আর পরে Ryans/TechLand এর কাছে allowlist বা product feed চাওয়া।
