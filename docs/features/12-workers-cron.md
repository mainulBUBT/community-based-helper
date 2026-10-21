# ১২ দাম আনার worker আর cron

**অবস্থা:** 🟡 আংশিক (কোড শেষ, আসল ডেটাবেসে চলেনি)

## যা আছে

`workers/` ফোল্ডারে, GitHub Actions এ চলে (`.github/workflows/`):

| job | কী করে | কখন |
|---|---|---|
| `prices` | ১০টা দোকানের সব দাম: প্রতিটা লিংক একবার পড়ে ওই পাতার সব ভার্সন একসাথে | প্রতি ৬ ঘণ্টায় |
| `discover` | দোকানের sitemap/ক্যাটাগরি থেকে listing, পাতার অপশন ভার্সনের সাথে মিলিয়ে নতুন দাম | পণ্য বা ভার্সন যোগ হলেই, আর প্রতি রাতে |
| `promos` | দোকানের অফার পেজ পড়া | দিনে একবার |
| `rebuild` | সাইট আবার build (SEO), থাকলে Cloudflare Pages এ deploy | প্রতি রাতে |

- প্রতিটা run `jobs.enabled` দেখে, অ্যাডমিন বন্ধ রাখলে চলে না। ফল `job_runs` আর `jobs.last_*` এ লেখে।
- দাম আনার ক্রম: দোকানের ভার্সন parser (`workers/stores/parsers.ts`) → JSON-LD/itemprop/og দাম → ছাঁটা লেখা থেকে LLM। কোনো দোকানে Playwright লাগে না।
- ভার্সন মেলানো (`workers/lib/variants.ts`): রং, region, সিম, ওয়ারেন্টি এক করে স্টকে থাকা সবচেয়ে কম দাম; স্টোরেজ, RAM, mm, ইঞ্চি, চিপ, GPU কোর, Cellular মিলতে হয়। প্রথমবার আগের দামের সাথে হুবহু মেলা অপশনে বাঁধা হয় (`offers.variant_key`)।
- নতুন পণ্য বা ভার্সন যোগ হলে DB trigger `jobs.run_requested_at` বসায়, আগের trigger GitHub workflow চালায়। পণ্যের `discover_requested_at > discovered_at` মানে খোঁজা বাকি।
- নিয়ম আর ধাপ: [পণ্য আর দোকান যোগের নিয়ম](../adding-products.md)।
- নিয়ম: নিজের পরিচয় দেওয়া user-agent, robots.txt মানা, প্রতি দোকানে একসাথে ২টার বেশি request নয়, 403 বা bot challenge পেলে সেই দোকান ওই run এ বাদ। কোনো stealth নেই।
- দাম ৬০% এর বেশি বদলালে প্রকাশ না করে `review_queue` এ `anomaly`। AI নিশ্চিত না হলে `match`।
- ব্যর্থ হলে Telegram সতর্কবার্তা (token থাকলে)।
- লোকাল পরীক্ষা (ডেটাবেস লাগে না): `npm run worker:dry`, আর `npm run worker:check` (data/catalog এর প্রতিটা দাম worker পড়তে পারে কি না)।

## পরীক্ষার ফল (২১ অক্টোবর ২০২৬)

- Star Tech, Apple Gadgets, Gadget & Gear: dry run এ দাম **আর ছবি** (JSON-LD `image`, fallback `og:image`) এসেছে।
- **Pickaboo: robots.txt 403** — নিয়ম অনুযায়ী বাদ।
- লোকাল ম্যাচার `8+128` ধরনের লেখা এখন বোঝে (আগে `+` কে "plus" বানিয়ে মডেল-নামের সাথে ঘাঁচত)। কাছাকাছি মডেল (Pro, Classic, 4G/5G লেখা নেই) সঠিকভাবে আটকায়।
- Apple Gadgets এর sitemap (১১,১১৩ URL) থেকে নমুনা পণ্যের আসল ছবি এনে `sample.ts` এ বসানো হয়েছে — সাইটে গ্যালারি আর কার্ডে দেখা যায়। আসল deploy এর আগে ছবি নিজেদের কাছে ক্যাশ করা উচিত।
- নমুনা offer গুলোতে এখন দোকানের সরাসরি পণ্য-লিংক আর **আসল দাম** আছে (Star Tech, Apple Gadgets, Gadget & Gear; Pickaboo robots-ব্লকড বলে হোমপেজ আর বানানো দাম)। ভার্সনের আসল দাম না পাওয়া গেলে অফিসিয়াল দামের পার্থক্য যোগ করে ধরা হয়েছে।
- ম্যাচার এখন রং-ও বোঝে: ভার্সনে রং লেখা থাকলে লিস্টিংয়ের রঙের সাথে মিলতে হয় (Black লিস্টিং Blue ভার্সন বাদ দেয়)।
- দোকানের অ্যাডাপ্টার সব আলাদা ফাইল ছিল — এখন একটাই `workers/stores/index.ts` রেজিস্ট্রি: সাধারণ দোকান শুধু ডেটা (sitemap ঠিকানা + URL প্রিফিক্স), ব্যতিক্রম (Gadget & Gear এর JS-দাম, Star Tech এর ক্যাটাগরি-হাঁটা, Pickaboo এর সার্চ) এক জায়গায় আলাদা করে লেখা।
- LLM: `.env.local` এ `LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY` দিলে ডেটাবেস ছাড়াই `npm run worker:dry` এ বিচারপতি পরীক্ষা চলে।

### সিঙ্ক ঠিক করা (২১ অক্টোবর ২০২৬, পরে)

আগে ৫৪৫টা দামের ২৮৯টা কখনো আপডেট হতো না, আর যা হতো তাও ভুল হতে পারত:

- worker চিনত ৪টা দোকান; Sumash, Kry, Executive Machines, Diamu, Dazzle, Motion View, Gadget Breeze যোগ হয়েছে। তালিকার বাইরের দোকানের লিংকও এখন সাধারণ পদ্ধতিতে চেষ্টা হয়।
- ১৪৭টা লিংকে একাধিক ভার্সন (৪টা স্টোরেজ এক পাতায়); আগে পাতার একটা দামই সব ভার্সনে বসত। এখন প্রতিটা দোকানের ভার্সন-ডেটা পড়া হয় (WooCommerce, Next.js/Nuxt payload, Star Tech এর `/product/product/variation`)।
- আনঅফিসিয়াল দাম (২৬৪টা) আপডেটের সময় নতুন "official" সারি বানাত; এখন offer এর id ধরে আপডেট।
- অ্যাডমিনের হাতে বসানো দাম (`source = admin`) সিঙ্ক হতো না; বিক্রেতার ওয়েবসাইট থাকলে এখন হয়।
- Star Tech এর ইয়ারবাড, হেডফোন, iMac, Mac mini, Mac Studio ক্যাটাগরি খোঁজা হতো না; "earbuds/headphone" শব্দ থাকলে listing বাদ যেত।
- `js-stores` job আর Playwright বাদ (Gadget & Gear এর দাম সাধারণ HTML এই আছে), Actions এর মিনিট বাঁচে।

`npm run worker:check` এর ফল: ৫৪৫টার ৫৪৫টাই সিঙ্ক হয়, পুরো run ২ মিনিটের মতো (৪টার দাম বদলাবে: দোকানে আরও সস্তা region স্টকে আছে, বা দাম কমেছে)। `--new` দিয়ে, মানে দাম না জেনে, ৫১৫টা নিজে মেলে, বাকি ৩০টা এমন পাতা যেখানে স্টোরেজ কোথাও লেখা নেই, সেগুলো AI বা যাচাইয়ে যায়; কোনোটা ভুল ভার্সনে বসে না। ৭টা পণ্যে পুরো `discover` চালিয়ে দেখা: ৭৫টা seed দামের ৬৩টা নিজে পেয়েছে ঠিক দামে, ১১টা যাচাইয়ে, ১টা পায়নি (Dazzle এর Sony, ওদের ক্যাটাগরিতে Sony অডিও নেই)।

## চালু করতে যা লাগবে

GitHub → Settings → Secrets and variables → Actions:

| নাম | কোথা থেকে |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | একই জায়গার service_role key (শুধু GitHub secret এ, কখনো ব্রাউজারে নয়) |
| `SUPABASE_PUBLISHABLE_KEY` | `rebuild` এর জন্য |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | ঐচ্ছিক, `rebuild` deploy করবে |

অ্যাডমিনের "এখনই চালান" সাথে সাথে কাজ করাতে `private_settings` এ GitHub token (README তে SQL আছে)। না দিলে পরের নির্ধারিত সময়ে চলে।

### GitHub থেকে চারটা দোকান আটকে যায় (২১ অক্টোবর ২০২৬)

আসল ডেটাবেসে প্রথম run: GitHub থেকে ২৯৫টা দাম আপডেট হয়, ২৫০টা বাদ যায়। Sumash Tech আর Gadget Breeze ডেটা-সেন্টারের আইপিকে Cloudflare এর "Just a moment..." challenge দেয় (robots.txt পর্যন্ত)। Kry International আর Gadget & Gear একটা-দুটো অনুরোধ ছাড়ে, পরে আবার challenge দেয়। `Accept-Language`/`Accept-Encoding` header যোগ করেও পুরো run এ কাজ হয়নি। প্রক্সি বা নকল ব্রাউজার দিয়ে পার হওয়া নিয়মের বাইরে।

বাংলাদেশের সাধারণ ইন্টারনেট থেকে চারটাই খোলে: মালিকের Mac থেকে `./scripts/local-worker.sh prices` ৫৪৫টা দামই আপডেট করে, ২ মিনিটে (key থাকে `~/.config/dordam/worker.env` এ)। স্থায়ী সমাধানের পথ: বাসার সবসময় চালু যন্ত্রে GitHub self-hosted runner, অথবা দোকানগুলোর কাছে bot এর allowlist চাওয়া।

## যা বাকি

- [ ] ⛔ ডেটাবেস ([database](11-database.md))।
- [ ] GitHub এ repo push আর secret বসানো (মালিকের অনুমতিতে)।
- [ ] migration `20261021103726_offer-sync` চালানো, তারপর `seed.sql`; প্রথম `prices` run এ প্রতিটা দাম তার অপশনে বাঁধা হবে, বার্তায় "ভার্সন পাতায় মেলেনি" ০ আসা উচিত।
- [ ] প্রথম `discover` (seed চালালেই নিজে চলবে) এর পরে যাচাই বাকি পেজ দেখা।
- [ ] Private repo হলে GitHub Actions এর মাসিক ২,০০০ মিনিটের হিসাব রাখা।
- [x] worker এর user-agent এ `https://dordam.app/about` লিংক আছে (`workers/lib/agent.ts`) — `/about/` পেজ এখন আছে (বাংলা, সাথে `/en/about/`), সেখানে bot এর পরিচয় আর যোগাযোগের তথ্য দেখানো হয়।
- [ ] Pickaboo আর পরে Ryans/TechLand এর কাছে allowlist বা product feed চাওয়া।
