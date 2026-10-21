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

## ধাপ ৫: ডোমেইন (ডোমেইন যেখানে কেনা সেখানেই থাকবে)

ডোমেইনের nameserver Cloudflare এ আনা হবে না, DNS থাকবে ডোমেইন বিক্রেতার কাছে (Namecheap, GoDaddy, Porkbun…)। এই অবস্থায় Cloudflare Pages শুধু **subdomain** নিতে পারে, তাই মূল সাইট চলবে **`www.dordam.app`** এ।

**৫.১ Pages এ www যোগ**

1. Cloudflare → Workers & Pages → `dordam` → **Custom domains** → **Set up a custom domain** → `www.dordam.app` → Continue।
2. Cloudflare একটা CNAME দেখাবে। ডোমেইন বিক্রেতার DNS প্যানেলে বসান:

   | Type | Host / Name | Value / Target | TTL |
   |---|---|---|---|
   | CNAME | `www` | `dordam.pages.dev` | Auto |

3. কয়েক মিনিট থেকে কয়েক ঘণ্টায় Pages এ "Active" দেখাবে। SSL নিজে থেকে আসে।

**৫.২ www ছাড়া `dordam.app`** (যেকোনো একটা)

- **ALIAS / ANAME থাকলে:** বিক্রেতার প্যানেলে Host `@`, Type `ALIAS` (বা `ANAME`), Value `dordam.pages.dev`। তারপর Pages এ `dordam.app` ও custom domain হিসেবে যোগ করুন। Cloudflare এটা আনুষ্ঠানিকভাবে সমর্থন করে না, তবে সাধারণত কাজ করে; Active না হলে পরের উপায়।
- **Redirect:** বিক্রেতার **URL Forwarding** এ `dordam.app` → `https://www.dordam.app` (301)। `.app` ডোমেইন শুধু https এ খোলে, তাই forwarding এ **HTTPS সমর্থন** থাকতে হবে; না থাকলে মূল ডোমেইন খুলবে না।
- কোনোটাই না হলে শুধু `www.dordam.app` ব্যবহার করুন, সব জায়গায় (কার্ড, Facebook) এই ঠিকানাই লিখুন।

**৫.৩ সাইটকে নতুন ঠিকানা জানানো**

1. GitHub → Settings → Secrets and variables → Actions: `NEXT_PUBLIC_SITE_URL = https://www.dordam.app`। লোকালে `.env.local` এও একই।
2. Actions → `rebuild` → Run workflow, যাতে sitemap, canonical আর SEO লিংক নতুন ঠিকানায় যায়।
3. Supabase → Authentication → URL Configuration: Site URL `https://www.dordam.app`, Redirect URL `https://www.dordam.app/admin/`।
4. Turnstile widget (ধাপ ৮) এর ডোমেইন তালিকায় `www.dordam.app` যোগ করুন।
5. **কোডে বদল লাগবে (এজেন্টকে বলুন):** worker এর bot নিজের পরিচয়ে `https://dordam.app/about` দেয় (`workers/lib/agent.ts`, আর `DordamBot` লেখা অন্য জায়গা)। মূল ডোমেইন না খুললে এটা `https://www.dordam.app/about` করতে হবে। `src/config/site.ts` এর ডিফল্ট `SITE_URL` ও একই ঠিকানায় আনুন।

**৫.৪ যাচাই**

- `https://www.dordam.app` আর (ধাপ ৫.২ করলে) `https://dordam.app` দুটোই খোলে এবং একটা অন্যটায় যায়।
- `https://www.dordam.app/sitemap.xml` খুলে দেখুন লিংকগুলো নতুন ঠিকানায়।
- `https://www.dordam.app/admin/` এ লগইন আর "পাসওয়ার্ড ভুলে গেছেন" মেইলের লিংক ঠিক ঠিকানায় যায়।

## ধাপ ৬: SEO আর ভিজিটর

1. Google Search Console → Add property → **URL prefix** → `https://www.dordam.app/` → HTML ফাইল বা meta tag দিয়ে যাচাই (DNS প্যানেলে TXT বসাতে পারলে "Domain" property ও চলে) → Sitemaps এ `sitemap.xml` জমা দিন।
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

## কোন key কোথায় থাকে

| key | কোথায় | গোপন? |
|---|---|---|
| Publishable key | `.env.local`, Cloudflare এ build এর সময়, GitHub secret | না, ব্রাউজারে যায়, RLS রক্ষা করে |
| Service / secret key | শুধু GitHub secret | **হ্যাঁ**, কখনো `.env.local` বা কোডে নয় |
| DB password | `.env.local` | হ্যাঁ |
| Cloudflare API token | GitHub secret | হ্যাঁ |
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
