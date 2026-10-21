# ১৮. নিরাপত্তা

অবস্থা: 🟡 কোডে যা করা যায় করা হয়েছে, Supabase ড্যাশবোর্ডের কিছু সেটিং বাকি

## যা আছে

- **RLS:** সব টেবিলে চালু। পাবলিক শুধু পড়তে পারে (পণ্য, ভার্সন, চালু বিক্রেতা, প্রকাশিত দাম, চালু অফার, সেটিংস)। লেখা শুধু অ্যাডমিন (`is_admin()`, security definer, ফাঁকা search_path)। `private_settings` (LLM key, token) শুধু অ্যাডমিন পড়তে পারে।
- **বেনামি লেখা মাত্র দুটো জায়গায়:** `review_queue` (ক্রেতার পাঠানো দাম) আর `page_views`। দুটোতেই আকার সীমা আর আগের তারিখ বসানো বন্ধ। পাঠানো দামে ১০ মিনিটে সর্বোচ্চ ৬০টা (trigger)। (`supabase/migrations/20261021100000_security.sql`)
- **ভিজিটর গোনার ফাংশন** শুধু লগইন করা ব্যবহারকারী চালাতে পারে, ফল দেয় শুধু অ্যাডমিনকে; সারি আর দিনের সীমা আছে।
- **লিংক:** DB তে `offers.url`, `sellers.website/facebook`, `products.specs_source` এ শুধু `http(s)://`। পড়ার সময়ও `utils/url.ts` এর `safeUrl` দিয়ে ছাঁকা হয় (mapper আর সেটিংসে), তাই `javascript:` বা `data:` লিংক কোথাও বসে না। ক্রেতার পাঠানো লিংকও একইভাবে ছাঁকা।
- **HTTP header** (`public/_headers`, Cloudflare Pages পড়ে): CSP, frame-ancestors none (admin কে iframe এ বসানো যায় না), HSTS, nosniff, Referrer-Policy, Permissions-Policy। `/admin/*` cache হয় না, index হয় না।
- **Service worker:** শুধু সফল (200) একই-সাইটের উত্তর cache করে, admin কখনো না।
- **Worker:** redirect শুধু একই সাইটের ভেতরে (SSRF বন্ধ), পেজের আকার ৩ MB পর্যন্ত, AI এর দেওয়া title/অফারের লেখা ছোট করা, ছবি শুধু `https`, অফারের ধরন নির্দিষ্ট তালিকা থেকে, AI থেকে পাওয়া অফার নিজে থেকে চালু হয় না, ৬০% এর বেশি দাম বদল যাচাইয়ে যায়।
- **Build:** সাইট build করার সময় service key আর LLM key env থেকে সরানো হয়।
- **JSON-LD:** `<` escape করা, তাই পণ্যের নামে `</script>` দিয়ে কিছু ঢোকানো যায় না।
- `npm audit --omit=dev`: ০টা সমস্যা (২০২৬-১০-২১)।

## Supabase ড্যাশবোর্ডে যা করতে হবে

1. Authentication → Sign In / Providers: **"Allow new users to sign up" বন্ধ**। অ্যাডমিন হাতে বানানো হয়।
2. Authentication → URL Configuration: Site URL `https://dordam.app`, Redirect URL শুধু `https://dordam.app/admin/`।
3. Authentication → Password: সর্বনিম্ন ১২ অক্ষর।
4. `_headers` এর CSP প্রথম deploy এ সমস্যা করলে কিছুদিন `Content-Security-Policy-Report-Only` নামে দিয়ে দেখুন।

## যা বাকি

- [x] অ্যাডমিন লগইন আর পাসওয়ার্ড ভোলার ফর্মে Turnstile (`src/components/admin/Turnstile.tsx`), যাচাই করে Supabase Auth; key বসানো বাকি ([setup-guide](../setup-guide.md) ধাপ ৮)।
- [ ] পাঠানো দামের ফর্মে Cloudflare Turnstile (IP ধরে সীমা)।
- [ ] `page_views` এর ১৮০ দিনের পুরনো সারি মোছার নির্ধারিত কাজ।
- [ ] GitHub token Supabase Vault এ, LLM key শুধু GitHub Actions secret এ (অ্যাডমিন শুধু বদলাতে পারবে, পড়তে না)।
- [ ] Supabase env ছাড়া production build হলে ডেমো অ্যাডমিন চালু থাকে (শুধু ব্রাউজারের নমুনা ডেটা বদলায়, আসল ক্ষতি নেই); deploy এর আগে env ঠিক আছে কিনা দেখুন।
