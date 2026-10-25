# ১৮. নিরাপত্তা

অবস্থা: 🟡 কোডে যা করা যায় করা হয়েছে, Supabase ড্যাশবোর্ডের কিছু সেটিং বাকি

## যা আছে

- **RLS:** সব টেবিলে চালু। পাবলিক শুধু পড়তে পারে (পণ্য, ভার্সন, চালু বিক্রেতা, প্রকাশিত দাম, চালু অফার, সেটিংস)। লেখা শুধু অ্যাডমিন (`is_admin()`, security definer, ফাঁকা search_path)। anon/authenticated এর TRUNCATE অধিকার নেই।
- **Secret শুধু লেখা যায়:** `private_settings` সরাসরি কেউ পড়তে পারে না, worker (service key) ছাড়া। অ্যাডমিন দেখে শুধু ঢাকা রূপ (`private_settings_masked()`, যেমন `••••a1b2`), GitHub token একদমই না। সেভ হয় `save_private_settings()` দিয়ে: key খালি রাখলে আগেরটা থাকে, GitHub token ব্রাউজার থেকে বদলানো যায় না। (`20261025041406_admin-hardening.sql`)
- **Audit log বদলানো যায় না:** অ্যাডমিন শুধু নিজের নামে নতুন লাইন যোগ করতে আর পড়তে পারে; বদলানো বা মোছা যায় না। ক্রেতার ফোন নম্বর audit এ কপি হয় না।
- **বেনামি লেখা মাত্র তিনটা জায়গায়:** `review_queue` (ক্রেতার পাঠানো দাম), `page_views` আর `price_alerts` (নিচে আলাদা)। দুটোতেই আকার সীমা, আর সময় (`created_at`) সার্ভার নিজে বসায়, তাই আগের বা ভবিষ্যতের তারিখ দেওয়া যায় না। (`20261021100000_security.sql`, `20261025040321_anon-insert-limits.sql`)
  - পাঠানো দাম: এক IP থেকে ১০ মিনিটে ৫টা, সবাই মিলে ৬০টা। বেশি হলে এরর। ফর্মেও দাম, ফোন, লিংক যাচাই আর দৈর্ঘ্যের সীমা।
  - ভিজিট: এক IP থেকে ঘণ্টায় ৩০০টা, সারা দিনে সবাই মিলে ১০,০০০টা। বেশি হলে চুপচাপ বাদ পড়ে। দিনের প্রথম ভিজিটে ৯০ দিনের পুরনো সারি মুছে যায়, তাই টেবিল সর্বোচ্চ প্রায় ৯ লাখ সারি (ফ্রি ৫০০ MB এর অনেক নিচে)। `path` শুধু `/` দিয়ে শুরু হওয়া সাইটের পথ, `//` বা `\` না।
  - IP নেওয়া হয় Cloudflare এর `cf-connecting-ip` header থেকে, `rate_limits` টেবিলে শুধু md5 hash থাকে, আসল IP না। এই টেবিল বেনামি কেউ পড়তে বা লিখতে পারে না।
- **দাম কমার নোটিফিকেশন:** `price_alerts` সরাসরি কেউ পড়তে বা লিখতে পারে না, শুধু `watch_prices`/`unwatch_prices`: push ঠিকানা শুধু পরিচিত push সার্ভিসের (Google, Mozilla, Apple, Windows), যাতে worker দিয়ে অন্য কোথাও অনুরোধ পাঠানো না যায়; এক IP থেকে ঘণ্টায় ৬০ বার, এক ব্রাউজারে ১০০টা পণ্য, মোট ৫০,০০০ সারি। কোন পণ্য কত দামে দেখছে তা worker ছাড়া কেউ পড়তে পারে না। (`20261025090000_price-alerts.sql`)
- **ভিজিটর গোনার ফাংশন** শুধু লগইন করা ব্যবহারকারী চালাতে পারে, ফল দেয় শুধু অ্যাডমিনকে; সারি আর দিনের সীমা আছে।
- **লিংক:** DB তে `offers.url`, `sellers.website/facebook`, `products.specs_source` এ শুধু `http(s)://`। পড়ার সময়ও `utils/url.ts` এর `safeUrl` দিয়ে ছাঁকা হয় (mapper আর সেটিংসে), তাই `javascript:` বা `data:` লিংক কোথাও বসে না। ক্রেতার পাঠানো লিংকও একইভাবে ছাঁকা।
- **HTTP header** (`public/_headers`, Cloudflare Pages পড়ে): CSP, frame-ancestors none (admin কে iframe এ বসানো যায় না), HSTS, nosniff, Referrer-Policy, Permissions-Policy। `/admin/*` cache হয় না, index হয় না।
- **Service worker:** শুধু সফল (200) একই-সাইটের উত্তর cache করে, admin কখনো না।
- **Worker:** শুধু http/https, আর লোকাল/private নেটওয়ার্কের ঠিকানা (127.x, 10.x, 192.168.x, 169.254.x, ::1 ইত্যাদি) প্রতিটা redirect এও আটকানো; redirect শুধু একই সাইটের ভেতরে; sitemap সর্বোচ্চ ২ ধাপ, একই সাইটের, একবারই; পেজের আকার ৩ MB পর্যন্ত, AI এর দেওয়া title/অফারের লেখা ছোট করা, ছবি শুধু `https`, অফারের ধরন নির্দিষ্ট তালিকা থেকে, AI থেকে পাওয়া অফার নিজে থেকে চালু হয় না, ৬০% এর বেশি দাম বদল যাচাইয়ে যায়।
- **Build:** সাইট build করার সময় service key, LLM key, Cloudflare token আর VAPID private key env থেকে সরানো হয়; wrangler deploy পায় শুধু Cloudflare এর env। workflow গুলোতে `permissions: contents: read`। AI এর prompt এ পাতার লেখাকে শুধু ডেটা ধরতে বলা, AI এর error এ উত্তরের লেখা আর থাকে না।
- **JSON-LD:** `<` escape করা, তাই পণ্যের নামে `</script>` দিয়ে কিছু ঢোকানো যায় না।
- `npm audit --omit=dev`: ০টা সমস্যা (২০২৬-১০-২১)।

## Supabase ড্যাশবোর্ডে যা করতে হবে

1. Authentication → Sign In / Providers: **"Allow new users to sign up" বন্ধ**। অ্যাডমিন হাতে বানানো হয়।
2. Authentication → URL Configuration: Site URL `https://dordam.app`, Redirect URL শুধু `https://dordam.app/admin/`।
3. Authentication → Password: সর্বনিম্ন ১২ অক্ষর।
4. `_headers` এর CSP প্রথম deploy এ সমস্যা করলে কিছুদিন `Content-Security-Policy-Report-Only` নামে দিয়ে দেখুন।

## যা বাকি

- [x] অ্যাডমিন লগইন আর পাসওয়ার্ড ভোলার ফর্মে Turnstile (`src/components/admin/Turnstile.tsx`), যাচাই করে Supabase Auth; key বসানো বাকি ([setup-guide](../setup-guide.md) ধাপ ৮)।
- [x] পাঠানো দাম আর ভিজিটে IP ধরে সীমা, দিনের সীমা, পুরনো ভিজিট মোছা (২৫ অক্টোবর; PGlite এ ৩৫টা টেস্ট পাস)।
- [ ] `npm run db:push` এর পর লাইভে একবার দেখা যে `client_ip()` IP পায় (`rate_limits` এ `submit:ip`/`views:ip` সারি আসে)। না পেলে শুধু সবার মিলে সীমা কাজ করবে।
- [x] পাঠানো দামের ফর্মে Turnstile: ব্রাউজার আর সরাসরি `review_queue` এ লিখতে পারে না, জমা হয় Edge Function `submit-price` দিয়ে (Turnstile যাচাই, hostname আর action মেলানো, ঘর ছাঁকা, অচেনা ঘর বাদ), তারপর service role এর `submit_price()` এ IP ধরে সীমা। (`supabase/functions/submit-price`, `20261025042430_submit-price-function.sql`)
- [x] অ্যাডমিন secret বদলাতে পারে, পড়তে না (২৫ অক্টোবর)।
- [x] `dispatch_job` আগে Vault এর `github_token` পড়ে, না থাকলে পুরনো জায়গা (`20261025042604_github-token-vault.sql`)। Vault এ সরানোর SQL: [index](../index.md) ধাপ ১২।
- **CSP:** `connect-src` এ শুধু এই প্রজেক্টের Supabase ঠিকানা, যেকোনো `*.supabase.co` নয়। `script-src 'unsafe-inline'` থাকছে, কারণ Next.js static export নিজেই পেজে inline script বসায়।
- [ ] Supabase env ছাড়া production build হলে ডেমো অ্যাডমিন চালু থাকে (শুধু ব্রাউজারের নমুনা ডেটা বদলায়, আসল ক্ষতি নেই); deploy এর আগে env ঠিক আছে কিনা দেখুন।
