# ১৯. AI ম্যানেজার

পুরো পরিকল্পনা: [ai-autopilot-proposal](../ai-autopilot-proposal.md)। এখানে যা বানানো হয়েছে আর কীভাবে চালু করবেন।

## ধাপ ১: চোখ আর মুখ (৩১ অক্টোবর)

- **কোথায় চলে:** আলাদা Cloudflare Worker `dordam-manager` (`agent/`), ফ্রি প্ল্যানে। একটা Durable Object (`Manager`, SQLite) কথাবার্তা মনে রাখে। কোনো নতুন npm প্যাকেজ নেই।
- **কথা বলা:**
  - Telegram: সাইটের alert-এর একই bot। শুধু অ্যাডমিনের "নোটিফিকেশন"-এ দেওয়া chat id থেকে আসা মেসেজের উত্তর দেয়।
  - অ্যাডমিন → AI ম্যানেজার পাতা: একই কথাবার্তা, প্রতিটা টুল-ডাক আর তার ফল দেখা যায়। পাশে সংযোগ, workers আর সময়সূচি।
- **সকালের রিপোর্ট:** প্রতিদিন সকাল ৯টায় (ঢাকা) Telegram-এ। সময় ঠিক রাখে Durable Object-এর alarm, তাই অ্যাকাউন্টের cron খরচ হয় না।
- **টুল (শুধু পড়ে):** `jobs_status`, `review_queue`, `find_price`, `visitor_searches`। কিছু বদলানোর টুল নেই।
- **AI:** অ্যাডমিনের AI সেটআপের তালিকা (`private_settings.llmModels`)। quota শেষ হলে (429) পরের সেটআপ, worker-এর মতোই।
- **নিরাপত্তা:**
  - অ্যাডমিন পাতা থেকে ডাকলে Supabase লগইন token যাচাই হয়, আর ব্যবহারকারী `admins`-এ আছেন কিনা দেখা হয়।
  - Telegram-এর webhook একটা গোপন header (service key থেকে বানানো) ছাড়া কিছু নেয় না।
  - Worker-এ service key থাকে (Cloudflare secret)। ধাপ ১-এর কোড শুধু পড়ে; লেখার ধাপ শুরুর আগে আলাদা সীমিত অ্যাকাউন্ট লাগবে।
- **Telegram যুক্ত হওয়া:** অ্যাডমিনে AI ম্যানেজার পাতা খুললে ম্যানেজার নিজেই Telegram-কে নিজের ঠিকানা জানিয়ে দেয় (`setWebhook`)। token বদলালে পরের বার পাতা খুললে আবার জানায়।

## চালু করার ধাপ (একবার)

1. `npx wrangler login`
2. `npm run agent:deploy`। শেষে Worker-এর ঠিকানা দেখাবে, যেমন `https://dordam-manager.<নাম>.workers.dev`।
3. দুটো secret বসান (মান চ্যাটে দেবেন না):
   - `npx wrangler secret put SUPABASE_URL -c agent/wrangler.jsonc`
   - `npx wrangler secret put SUPABASE_SERVICE_KEY -c agent/wrangler.jsonc`
4. GitHub → Settings → Variables-এ `MANAGER_URL` = ধাপ ২-এর ঠিকানা। তারপর `rebuild` চালান, যাতে অ্যাডমিন পাতা ম্যানেজারকে খুঁজে পায়।
5. অ্যাডমিন → AI ম্যানেজার খুলুন। Telegram "যুক্ত" দেখালে bot-কে কিছু লিখে দেখুন।

লোকালে পরীক্ষা: `agent/.dev.vars`-এ `SUPABASE_URL` আর `SUPABASE_SERVICE_KEY` দিয়ে `npm run agent:dev`।

## যা বাকি

- [x] ধাপ ১: Telegram আর অ্যাডমিন পাতায় কথা, সকালের রিপোর্ট, শুধু-পড়ার টুল
- [ ] লাইভে চালু (উপরের ধাপগুলো)
- [ ] ধাপ ২: পাহারাদার (ব্যর্থ কাজ আবার চালানো, দাম পুরনো হলে খোঁজ)
- [ ] ধাপ ৩–৫: প্রস্তাব দেখুন
