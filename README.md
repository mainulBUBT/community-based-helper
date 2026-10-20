# সাশ্রয়

বাংলাদেশের দোকানগুলোতে মোবাইল, Apple আর স্মার্টওয়াচের দাম পাশাপাশি দেখার সাইট। অ্যাডমিন প্যানেল একই Next.js অ্যাপে `/admin` এ।

## চালানো

```bash
npm install
npm run dev
```

`.env.local` না থাকলে অ্যাপ `src/data/sample.ts` এর নমুনা ডেটায় চলে, অ্যাডমিন লগইন ছাড়াই খোলে।

## Supabase যুক্ত করা

1. নতুন Supabase প্রজেক্ট খুলে `npx supabase link --project-ref <ref>`
2. `npm run db:push` দিয়ে `supabase/migrations` চালান
3. Authentication থেকে অ্যাডমিন ইউজার বানিয়ে SQL Editor এ: `insert into admins (user_id) values ('<user id>');`
4. `.env.example` দেখে `.env.local` এ URL, publishable key আর সাইটের ঠিকানা দিন

## ফোল্ডার

| ফোল্ডার | কী থাকে |
|---|---|
| `src/app/(site)` | ইউজারের পেজ: হোম, খোঁজা, পণ্য, বিক্রেতা, সেভ করা |
| `src/app/admin` | অ্যাডমিন পেজ |
| `src/components/{ui,layout,product,seller,forms,admin}` | UI কম্পোনেন্ট |
| `src/services` | ডেটা আনা আর সেভ করা (`admin/` এ অ্যাডমিনের কাজ) |
| `src/hooks`, `src/lib`, `src/utils` | হুক, side-effect হেল্পার, pure ফাংশন |
| `src/config`, `src/types`, `src/data` | সেটিংস, টাইপ, নমুনা ডেটা |
| `supabase/migrations` | টেবিল, RLS আর ফাংশন |
| `public/sw.js`, `src/app/manifest.ts` | PWA |

## SEO

`npm run build` প্রতিটা পণ্য আর বিক্রেতার আলাদা HTML পেজ, `sitemap.xml` আর `robots.txt` বানায়। নতুন পণ্য সাইটে আসে পরের build এ। ডোমেইন বদলালে `NEXT_PUBLIC_SITE_URL` বদলে আবার build দিন।

## দাম আনার worker (`workers/`)

GitHub Actions এ চলে: `prices` (প্রতি ৩ ঘণ্টায়), `js-stores` আর `discover` (Playwright লাগে), `promos`, `rebuild`। প্রতিটা run `jobs` আর `job_runs` এ লেখে; অ্যাডমিন থেকে কাজ বন্ধ রাখা যায়। দোকানের robots.txt মানা হয়, প্রতি দোকানে একসাথে ২টার বেশি request যায় না, 403 বা bot-challenge পেলে সেই দোকান ওই run এ বাদ পড়ে।

GitHub → Settings → Secrets and variables → Actions এ দিন:

| নাম | কোথা থেকে |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | একই জায়গার service_role / secret key (শুধু এখানে, কখনো `.env.local` বা ব্রাউজারে না) |
| `SUPABASE_PUBLISHABLE_KEY` | publishable key, শুধু `rebuild` এর জন্য |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | ঐচ্ছিক; থাকলে `rebuild` Cloudflare Pages এ deploy করে |

LLM key, Telegram bot token আর alert chat id অ্যাডমিন → সেটিংস থেকে `private_settings` এ রাখা হয়। অ্যাডমিনের "এখনই চালাও" বোতামে সাথে সাথে চালাতে চাইলে SQL Editor এ একটা fine-grained GitHub token (Actions: write) দিন:

```sql
update private_settings set value = value || '{"github": {"repo": "<owner>/<repo>", "token": "<token>"}}';
```

না দিলে অনুরোধটা পরের নির্ধারিত run এ চলে। লোকালি পরীক্ষা: `npm run worker:dry` প্রতি দোকানের একটা পণ্যের দাম দেখায়, ডেটাবেস লাগে না।
