# ১১ ডেটাবেস (Supabase)

**অবস্থা:** ⛔ আটকে আছে

## কেন আটকে

`npx supabase projects create` চালালে `Forbidden` আসে, আর `supabase orgs list` খালি দেখায়। এই মেশিনের CLI টোকেন সম্ভবত শুধু পুরনো পথঘাট প্রজেক্টের অনুমতি পাওয়া। ফ্রি প্ল্যানে ২টা প্রজেক্ট রাখা যায়, এখন একটা আছে (pothghat)।

**সমাধান (মালিক করবেন):**
- Terminal এ `npx supabase login` চালিয়ে আবার লগইন, তারপর এজেন্ট প্রজেক্ট খুলবে। অথবা
- supabase.com এ নিজে প্রজেক্ট খুলে (নাম `sashroy`, অঞ্চল Singapore) project ref দেওয়া।

DB পাসওয়ার্ড বানিয়ে `.env.local` এ `SUPABASE_DB_PASSWORD` হিসেবে রাখা আছে, প্রজেক্ট খোলার সময় এটাই ব্যবহার করা যাবে। `.env.local` git এ যায় না।

## প্রজেক্ট খোলার পর

1. `npx supabase link --project-ref <ref>`
2. `npm run db:push` (দুটো migration চলবে)
3. `npx supabase projects api-keys --project-ref <ref>` থেকে URL আর publishable key নিয়ে `.env.local` এ:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   NEXT_PUBLIC_SITE_URL=
   ```
4. [auth](10-auth.md) এর ধাপে অ্যাডমিন বানানো।
5. `npm run dev` চালিয়ে হোম আর অ্যাডমিন দেখা। প্রথমে ডেটা খালি থাকবে, worker চালালে ভরবে।

পথঘাটের প্রজেক্ট `zoodmqxxbevlhepwoyjt` এ কখনো link বা push করবেন না।

## টেবিল

`supabase/migrations/20261020120000_init.sql`:

| টেবিল | কী |
|---|---|
| `products`, `variants` | পণ্য আর তার ভার্সন (অফিসিয়াল দামসহ) |
| `sellers` | দোকান আর গ্রুপ, `verified`, ওয়েবসাইট বা ফোন |
| `offers` | কোন ভার্সন কোন দোকানে কত, `condition` (official/unofficial/used), `source`, `published`, `expires_at` |
| `price_history` | দাম বদলালে trigger নিজে থেকে সারি লেখে |
| `promos` | কার্ড/bKash/কিস্তি অফার |
| `review_queue` | `match`, `anomaly`, `submission` |
| `jobs`, `job_runs` | cron এর অবস্থা আর লগ |
| `audit_log` | অ্যাডমিনের কাজ |
| `site_settings` | সবাই পড়তে পারে (নাম, SEO, হোম পেজের লেখা) |
| `private_settings` | শুধু অ্যাডমিন (LLM key, Telegram token, GitHub token) |
| `page_views` | ভিজিটর গোনা, সবাই লিখতে পারে, শুধু অ্যাডমিন পড়ে |
| `admins` | কারা অ্যাডমিন |

`20261020130000_workers.sql`: `pg_net`, শুরুর ৪টা দোকান, job এর সময়সূচি, "এখনই চালান" চাপলে GitHub workflow চালু করার trigger।

ফাংশন: `is_admin()`, `visitor_stats(days)`, `top_pages(days, max_rows)`।

## যা বাকি

- [ ] ⛔ প্রজেক্ট খোলা আর ওপরের ধাপ।
- [ ] ফ্রি tier এ ৭ দিন কাজ না হলে প্রজেক্ট থেমে যায়। worker নিয়মিত চললে সমস্যা নেই।
- [ ] backup: ফ্রি tier এ নিজে থেকে হয় না, মাঝে মাঝে `supabase db dump`।
