# চালু করার গাইড: Supabase, Cloudflare আর ডোমেইন

এই গাইড ধাপে ধাপে সাইটটা ইন্টারনেটে তোলার জন্য। মানুষ বা এজেন্ট, যে-ই করুক, এই ক্রমে করবে। কোনো ধাপে অ্যাকাউন্টে লগইন বা পাসওয়ার্ড লাগলে সেটা মালিক নিজে করবেন।

নিচে `<নাম>` মানে প্রজেক্টের নাম (যেমন `dordam`), আর `<ডোমেইন>` মানে আপনার কেনা ডোমেইন (যেমন `example.com`)।

---

## কীভাবে চলে

```
               ┌──────────────────────────────┐
  ক্রেতা ────▶ │ Cloudflare Pages              │  static HTML, JS, ছবি
  (ব্রাউজার)   │ <ডোমেইন>                      │  (প্রতিটা পণ্যের আলাদা পেজ, SEO এর জন্য)
               └──────────────┬───────────────┘
                              │ পেজ খোলার পর ব্রাউজার সরাসরি
                              ▼
               ┌──────────────────────────────┐
               │ Supabase                      │  ডেটাবেস + লগইন
               │ publishable key + RLS          │  সবাই পড়তে পারে, লিখতে পারে শুধু অ্যাডমিন
               └──────────────▲───────────────┘
                              │ service key দিয়ে লেখে
               ┌──────────────┴───────────────┐
               │ GitHub Actions (workers/)      │  প্রতি ৬ ঘণ্টায় দাম আনে,
               │                                │  প্রতি রাতে সাইট নতুন করে build করে
               └──────────────┬───────────────┘
                              │ rebuild শেষে deploy
                              ▼
                       Cloudflare Pages
```

- **সাইট নিজে কোনো সার্ভার চালায় না।** Cloudflare শুধু ফাইল দেয়, তাই খরচ নেই আর দ্রুত।
- **দাম আর তথ্য** ব্রাউজার Supabase থেকে আনে। কে কী পড়তে বা লিখতে পারবে, তা ডেটাবেসের RLS নিয়ম ঠিক করে।
- **অ্যাডমিন লগইন** Supabase Auth দিয়ে। লগইন করা ইউজার `admins` টেবিলে থাকলে তবেই লিখতে পারে।
- **worker** GitHub এ চলে, দোকান থেকে দাম এনে Supabase এ লেখে। প্রতি রাতে `rebuild` নতুন পণ্যের পেজ বানিয়ে Cloudflare এ তোলে।

---

## ধাপ ১: Supabase

1. supabase.com এ লগইন করে **New project**:
   - নাম `<নাম>`, অঞ্চল **Southeast Asia (Singapore)**, প্ল্যান Free।
   - Database password: `.env.local` এর `SUPABASE_DB_PASSWORD` ব্যবহার করুন, অথবা নিজে দিয়ে সেখানে বদলে রাখুন।
   - পুরনো `pothghat` প্রজেক্টে নয়, নতুন প্রজেক্ট।
2. প্রজেক্ট তৈরি হলে Settings → General থেকে **Project ref** কপি করুন।
3. এই ফোল্ডারে terminal এ:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npm run db:push
   ```
   চারটা migration চলবে: সব টেবিল, নিয়ম, ক্যাটাগরি, নিরাপত্তা, শুরুর দোকান আর cron এর তালিকা।
   তারপর আসল পণ্য আর দাম ঢোকাতে Supabase ড্যাশবোর্ডের SQL Editor এ `supabase/seed.sql` এর পুরোটা চালান (দুবার চালালেও কিছু দুবার ঢোকে না)।
4. Settings → API থেকে তিনটা জিনিস নিন:
   - **Project URL**
   - **Publishable key** (আগে নাম ছিল anon key): এটা সাইটে যাবে, প্রকাশ্য হলেও সমস্যা নেই
   - **Secret / service_role key**: এটা গোপন, শুধু GitHub secret এ যাবে
5. Authentication → URL Configuration:
   - **Site URL:** `https://<ডোমেইন>`
   - **Redirect URLs:** `https://<ডোমেইন>/admin/`, `https://<নাম>.pages.dev/admin/`, `http://localhost:3100/admin/`
6. Authentication → Providers → Email চালু রাখুন। "Allow new users to sign up" **বন্ধ** করুন, যাতে বাইরের কেউ অ্যাকাউন্ট খুলতে না পারে।
7. **নিজেকে অ্যাডমিন বানান:**
   - Authentication → Users → **Add user** → নিজের ইমেইল আর পাসওয়ার্ড দিন।
   - SQL Editor এ চালান:
     ```sql
     insert into admins (user_id)
     select id from auth.users where email = '<আপনার ইমেইল>';
     ```

## ধাপ ২: লোকালে পরীক্ষা

1. `.env.local` এ বসান (git এ যায় না):
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key>
   NEXT_PUBLIC_SITE_URL=https://<ডোমেইন>
   ```
2. `npm run dev` → `http://localhost:3100/admin/` এ লগইন করে দেখুন।
3. ডেটাবেস প্রথমে খালি। অ্যাডমিন থেকে কয়েকটা পণ্য বা দাম যোগ করে হোম পেজে দেখুন।

## ধাপ ৩: GitHub (worker এর জন্য)

1. GitHub এ নতুন repo বানিয়ে কোড push করুন। **Private** হলে Actions এ মাসে ২,০০০ ফ্রি মিনিট, **Public** হলে সীমা নেই।
2. Settings → Secrets and variables → Actions → **Secrets**:

   | নাম | মান |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_KEY` | Secret / service_role key |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `CLOUDFLARE_API_TOKEN` | ধাপ ৪ এ বানানো token |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare ড্যাশবোর্ডের ডান পাশে লেখা Account ID |

3. একই পাতার **Variables** ট্যাবে:

   | নাম | মান |
   |---|---|
   | `SITE_URL` | `https://<ডোমেইন>` |
   | `CLOUDFLARE_PAGES_PROJECT` | `<নাম>` |

4. Actions ট্যাবে গিয়ে workflow গুলো চালু করুন। প্রথমবার `discover` হাতে চালান (Run workflow), তারপর `prices`।
5. অ্যাডমিনের "এখনই চালান" বোতাম সাথে সাথে কাজ করাতে চাইলে একটা fine-grained GitHub token (শুধু এই repo, Actions: Read and write) বানিয়ে SQL Editor এ:
   ```sql
   update private_settings set value = value || '{"github": {"repo": "<owner>/<repo>", "token": "<token>"}}';
   ```

## ধাপ ৪: Cloudflare Pages

1. Cloudflare ড্যাশবোর্ড → My Profile → API Tokens → **Create token** → "Edit Cloudflare Workers" টেমপ্লেট, অথবা কাস্টম token যাতে শুধু **Account → Cloudflare Pages → Edit** অনুমতি থাকে। এটা ধাপ ৩ এর `CLOUDFLARE_API_TOKEN`।
2. প্রথমবার নিজের কম্পিউটার থেকে:
   ```bash
   npx wrangler login
   npx wrangler pages project create <নাম> --production-branch main
   npm run build
   npx wrangler pages deploy out --project-name <নাম> --branch main
   ```
   শেষে `https://<নাম>.pages.dev` এ সাইট চলে আসবে।
3. এরপর প্রতি রাতে GitHub এর `rebuild` নিজেই build আর deploy করবে। হাতে চালাতে চাইলে Actions → rebuild → Run workflow।

## ধাপ ৫: ডোমেইন

ডোমেইন `dordam.app` এর nameserver Cloudflare এ আনা হয়েছে, তাই মূল ঠিকানা **`https://dordam.app`** (www ছাড়া); `www.dordam.app` নিজে থেকে `dordam.app` এ যায়। ৫.১ হয়ে গেছে; **৫.২ না করলে SEO লিংক পুরনো `dordam.pages.dev` ঠিকানাতেই থাকে।**

**৫.১ Pages এ ডোমেইন যোগ** (হয়ে গেছে; নতুন ডোমেইন লাগলে একইভাবে)

1. ডোমেইন বিক্রেতার প্যানেলে nameserver বদলে Cloudflare এর দেওয়া দুটো বসান (Cloudflare → Add a site → ডোমেইন → Free plan → যে nameserver দেখাবে)।
2. Cloudflare → Workers & Pages → `dordam` → **Custom domains** → **Set up a custom domain** → `dordam.app`। DNS Cloudflare এ থাকায় রেকর্ড নিজে বসে। একইভাবে `www.dordam.app` ও যোগ করুন, অথবা Rules → Redirect Rules এ `www` → `dordam.app`।
3. কয়েক মিনিটে "Active" দেখায়, SSL নিজে থেকে আসে।

**৫.২ সাইটকে নতুন ঠিকানা জানানো** (canonical, sitemap আর robots.txt এর ঠিকানা build এর সময় এখান থেকে বসে)

1. GitHub → Settings → Secrets and variables → Actions → **Variables** ট্যাব (Secret নয়; workflow `vars.SITE_URL` পড়ে): `SITE_URL = https://dordam.app`। লোকালে `.env.local` এ `NEXT_PUBLIC_SITE_URL=https://dordam.app` (আছে)।
2. Actions → `rebuild` → Run workflow। Variable বদলের পর rebuild না দিলে live সাইট পুরনো ঠিকানাই দেখাবে।
3. Supabase → Authentication → URL Configuration: Site URL `https://dordam.app`, Redirect URLs এ `https://dordam.app/admin/` (repo র `supabase/config.toml` এ একই আছে)।
4. Turnstile widget (ধাপ ৮) এর ডোমেইন তালিকায় `dordam.app` যোগ করুন।

**৫.৩ যাচাই**

- `https://dordam.app` খোলে, `https://www.dordam.app` → `https://dordam.app` এ যায়।
- `https://dordam.app/robots.txt` আর `https://dordam.app/sitemap.xml` এ সব লিংক `https://dordam.app/...` (পুরনো `dordam.pages.dev` নয়)। পেজের source এ `<link rel="canonical">` ও তাই।
- `https://dordam.app/admin/` এ লগইন আর "পাসওয়ার্ড ভুলে গেছেন" মেইলের লিংক `dordam.app` এ যায়।
- `dordam.pages.dev` খোলা থাকলে ক্ষতি নেই: canonical `dordam.app` দেখায়, তাই Google মূল ঠিকানাই নেবে।

## ধাপ ৬: SEO আর ভিজিটর

1. Google Search Console → Add property → **Domain** → `dordam.app` → যে TXT রেকর্ড দেবে সেটা Cloudflare → DNS এ বসান → Verify → Sitemaps এ `https://dordam.app/sitemap.xml` জমা দিন। (ধাপ ৫.২ এর rebuild এর পরে করুন, নয়তো sitemap এ পুরনো ঠিকানা যাবে।)
2. (ঐচ্ছিক) Cloudflare → Web Analytics → সাইট যোগ → যে token দেবে সেটা অ্যাডমিন → সেটিংস → "ভিজিটর গোনা" তে বসান। নিজেদের ভিজিটর হিসাব এটা ছাড়াও চলে।
3. অ্যাডমিন → সেটিংস থেকে সাইটের নাম, SEO শিরোনাম আর বর্ণনা, যোগাযোগের তথ্য দিন। পরের build এ সব পেজে বসবে।

## ধাপ ৭: AI আর সতর্কবার্তা

1. যে OpenAI-compatible সার্ভিস ব্যবহার করবেন তার Base URL (যেমন `https://api.openai.com/v1`), মডেলের নাম আর API key নিন।
2. অ্যাডমিন → কাজ ও AI → Base URL, মডেল আর key দিয়ে সেভ, তারপর "সংযোগ পরীক্ষা"।
3. (ঐচ্ছিক) Telegram এ @BotFather দিয়ে bot বানিয়ে token, আর নিজের chat id একই পাতায় দিন। কোনো কাজ ব্যর্থ হলে সেখানে বার্তা যাবে।

---

## ধাপ ৮: অ্যাডমিন লগইনে captcha (Cloudflare Turnstile, ফ্রি)

1. Cloudflare → Turnstile → Add widget। ডোমেইন: আপনার ডোমেইন আর `localhost`, মোড Managed।
2. Site key: GitHub → Settings → Secrets and variables → Actions → **Variables** এ `TURNSTILE_SITE_KEY`; লোকালে `.env.local` এ `NEXT_PUBLIC_TURNSTILE_SITE_KEY`।
3. Secret key: Supabase → Authentication → Attack Protection → Enable Captcha → Cloudflare Turnstile → secret বসিয়ে সেভ। টোকেন Supabase নিজেই যাচাই করে, আলাদা সার্ভার লাগে না।
4. দুটো একসাথে দিন: Supabase এ captcha চালু কিন্তু site key ছাড়া build হলে কেউ লগইন করতে পারবে না; উল্টোটা হলে বক্স দেখাবে কিন্তু যাচাই হবে না।
5. পরের build এর পরে লগইন আর "পাসওয়ার্ড ভুলে গেছেন" দুটোই একবার চালিয়ে দেখুন।

## ধাপ ৯: দাম কমলে নোটিফিকেশন (Web Push, ফ্রি)

1. লোকালে চালান: `npx web-push generate-vapid-keys`। দুটো key দেখাবে।
2. Public Key: GitHub → Settings → Secrets and variables → Actions → **Variables** এ `VAPID_PUBLIC_KEY`।
3. Private Key: একই জায়গায় **Secrets** এ `VAPID_PRIVATE_KEY`। এটা কোথাও কোডে বা `.env.local` এ রাখবেন না।
4. `npm run db:push` (নতুন `price_alerts` migration), তারপর rebuild। সেভ করা পাতায় "চালু করুন" দেখাবে।
5. Key পরে বদলালে আগের সবার নোটিফিকেশন বন্ধ হয়ে যাবে, তাই একবার বসিয়ে রেখে দিন।

## কোন key কোথায় থাকে

| key | কোথায় | গোপন? |
|---|---|---|
| Publishable key | `.env.local`, Cloudflare এ build এর সময়, GitHub secret | না, ব্রাউজারে যায়, RLS রক্ষা করে |
| Service / secret key | শুধু GitHub secret | **হ্যাঁ**, কখনো `.env.local` বা কোডে নয় |
| DB password | `.env.local` | হ্যাঁ |
| Cloudflare API token | GitHub secret | হ্যাঁ |
| VAPID public key | GitHub variable, ব্রাউজারে যায় | না |
| VAPID private key | শুধু GitHub secret | হ্যাঁ |
| AI key, Telegram token, GitHub token | Supabase `private_settings` (শুধু অ্যাডমিন পড়তে পারে) | হ্যাঁ |

## খরচ আর সীমা (সব ফ্রি)

| সেবা | ফ্রিতে যা পাবেন | খেয়াল রাখুন |
|---|---|---|
| Cloudflare Pages | সীমাহীন ভিজিটর, মাসে ৫০০ build | build GitHub এ হয়, তাই Pages এর build কোটা লাগে না |
| Supabase | ৫০০MB ডেটাবেস, ৫০,০০০ মাসিক ইউজার | ৭ দিন কোনো কাজ না হলে প্রজেক্ট থামে, worker চললে হবে না |
| GitHub Actions | public এ সীমাহীন, private এ মাসে ২,০০০ মিনিট | private হলে `prices` কম ঘন ঘন চালান |
| AI (OpenAI-compatible) | নিজের সাবস্ক্রিপশন | AI শুধু অস্পষ্ট পাতা মেলাতে লাগে, রাতে কয়েকটা অনুরোধ |

## সমস্যা হলে

- **সাইট খোলে কিন্তু দাম আসে না:** ব্রাউজারের console দেখুন। Supabase URL বা key ভুল, অথবা migration চলেনি।
- **অ্যাডমিনে লগইন হয় কিন্তু "অনুমতি নেই":** `admins` টেবিলে আপনার user id নেই, ধাপ ১.৭ আবার করুন।
- **পাসওয়ার্ড রিসেটের লিংক কাজ করে না:** Supabase এর Redirect URLs এ `/admin/` ঠিকানা নেই।
- **নতুন পণ্যের পেজ ৪০৪:** পরের build পর্যন্ত অপেক্ষা করুন, অথবা `rebuild` হাতে চালান।
- **বাংলাদেশে Cloudflare আটকালে:** একই `out/` ফোল্ডার Netlify বা Vercel এ তুলে ডোমেইনের DNS সেদিকে ঘুরিয়ে দিন। Supabase আলাদা জায়গায় থাকায় ডেটা চালু থাকবে।
