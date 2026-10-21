# ১১ ডেটাবেস (Supabase)

**অবস্থা:** ⛔ আটকে আছে

## কেন আটকে

`npx supabase projects create` চালালে `Forbidden` আসে, আর `supabase orgs list` খালি দেখায়। এই মেশিনের CLI টোকেন সম্ভবত শুধু পুরনো পথঘাট প্রজেক্টের অনুমতি পাওয়া। ফ্রি প্ল্যানে ২টা প্রজেক্ট রাখা যায়, এখন একটা আছে (pothghat)।

**সমাধান (মালিক করবেন):**
- Terminal এ `npx supabase login` চালিয়ে আবার লগইন, তারপর এজেন্ট প্রজেক্ট খুলবে। অথবা
- supabase.com এ নিজে প্রজেক্ট খুলে (নাম `dordam`, অঞ্চল Singapore) project ref দেওয়া।

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

`20261021054639_product-details.sql`:
- `categories` টেবিল (`slug`, বাংলা/English নাম, `icon`, `variant_axes`, `position`, `active`)। শুরুতে mobile, laptop, tablet, watch। নতুন ভাগ (টিভি, হেডফোন…) শুধু একটা সারি যোগ করলেই হয়; কোড বদলাতে হয় না।
- `products.category` এখন `categories.slug` এর foreign key (পুরনো enum বাদ, `apple` → `mobile`)। Apple আলাদা ভাগ নয়, ব্র্যান্ড; মেনুতে `?brand=Apple` লিংক।
- `variants.attributes` (jsonb, যেমন `{"chip":"M5","ram":"16GB","storage":"512GB"}`) আর `sku`। কোন ঘরগুলো লাগবে তা ভাগের `variant_axes` ঠিক করে (চাবি: chip, ram, storage, size, connectivity, edition)। `label` থাকে, worker এখনো ওটা দিয়ে মেলায়।
- পণ্যে `colors`, `regions`, `description`, `description_en`, `specs` (jsonb array: `[{group, items:[{label, value}]}]`), `specs_source` (তথ্যসূত্রের লিংক)।
- `offers.color` (কোনো দোকান নির্দিষ্ট রঙের দাম দিলে)।

ফাংশন: `is_admin()`, `visitor_stats(days)`, `top_pages(days, max_rows)`।

## কোনটার সাথে কোনটার সম্পর্ক

```
categories (slug, variant_axes)
   └─< products (category → categories.slug)
          └─< variants (product_id, attributes: chip/ram/storage/size/connectivity/edition/color)
                 └─< offers (variant_id, seller_id, condition, region, price, source, published)
                        └─< price_history (offer_id, trigger দিয়ে)
sellers ─< offers
sellers ─< promos (seller_id; কার্ড/bKash অফার, দোকানের সব দামে খাটে)
review_queue: payload এ productId/variantId/offerId (submission, match, anomaly)
```

- **দাম কোথায় বসে:** সবসময় `offers` এ, একটা ভার্সন + একটা বিক্রেতা + condition এ একটাই সারি (`variant_id, seller_id, condition` unique)। একই দোকানের official আর unofficial দাম আলাদা সারি।
- **রং/RAM/স্টোরেজে দাম আলাদা হলে:** প্রতিটা মিলের আলাদা `variant`। দাম একই হলে রং শুধু `products.colors` এ।
- **কোন দেশের ভার্সন:** unofficial দামের জন্য `offers.region`; পণ্যে কোন কোন দেশের পাওয়া যায় তা `products.regions` (পরামর্শ হিসেবে)।
- **অফিসিয়াল দাম:** ব্র্যান্ডের নির্ধারিত দাম `variants.official_price`, দোকানের দাম না।
- **কে বসাল:** `offers.source` = site (worker সাইট থেকে), seller, user (অ্যাডমিন যাচাই করে বসানো ক্রেতার দাম), admin।
- **মুছলে:** পণ্য মুছলে তার ভার্সন, দাম, দামের ইতিহাস মুছে যায় (cascade)। ক্যাটাগরিতে পণ্য থাকলে মোছা যায় না।

## যা বাকি

- [ ] ⛔ প্রজেক্ট খোলা আর ওপরের ধাপ।
- [x] `products` এ `images text[]` কলামের নতুন migration (`npm run db:new`) — পণ্যের পেজের গ্যালারির জন্য। ফাইল তৈরি (`20261020181436_product-images.sql`), worker ও ছবি বের করে এতে জমায় (সর্বোচ্চ ৪টা); প্রজেক্ট খুলে push করতে হবে।
- [ ] ফ্রি tier এ ৭ দিন কাজ না হলে প্রজেক্ট থেমে যায়। worker নিয়মিত চললে সমস্যা নেই।
- [ ] backup: ফ্রি tier এ নিজে থেকে হয় না, মাঝে মাঝে `supabase db dump`।
