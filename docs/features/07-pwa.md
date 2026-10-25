# ০৭ PWA

**অবস্থা:** 🟡 আংশিক (কোড শেষ, আসল ফোনে ইনস্টল করে দেখা হয়নি)

## যা আছে

- `src/app/manifest.ts`: নাম, রং, আইকন (192, 512, maskable), শর্টকাট (খুঁজুন, সেভ করা)।
- `public/sw.js`: `_next/static` আর আইকন cache থেকে দেয় (সর্বোচ্চ ২০০টা)। পেজ আর `/data/catalog/*.json` নেটওয়ার্ক থেকে আনে, না পেলে cache (সর্বোচ্চ ৮০টা), পেজ তাও না পেলে `/offline/`। তাই অফলাইনেও খোঁজা আর সেভ করা চলে। `/admin` কখনো cache হয় না।
- `src/components/layout/ServiceWorker.tsx`: শুধু production build এ service worker চালু করে।
- হেডারে "অ্যাপ নামান" বোতাম, ব্রাউজার অনুমতি দিলে তবেই দেখায় (`src/hooks/useInstallPrompt.ts`)।
- **দাম কমলে নোটিফিকেশন (Web Push):** সেভ করা পাতায় আর সেভ করা পণ্যের পাতায় "চালু করুন" (`src/components/product/PriceAlertToggle.tsx`, `src/services/price-alerts.ts`)। চালু করলে ব্রাউজারের push ঠিকানা আর সেভ করা পণ্য `price_alerts` এ যায় (`watch_prices`); পরে সেভ বা সেভ থেকে সরালে নিজে থেকে যোগ/বাদ, "বন্ধ করুন" এ সব মোছে। লগইন লাগে না।
  - দাম ধরা হয় কার্ডের মতো, শুধু স্টকে থাকা দোকান থেকে (`alert_price`)। জানানো হয় যদি অন্তত ৳১০০ আর ১% কমে, একটা পণ্যে দিনে একবার; এক ব্রাউজারে কয়েকটা কমলে একটাই নোটিফিকেশন, সেভ করা পাতায় নিয়ে যায়।
  - পাঠায় `rebuild` job, সাইট deploy হওয়ার পরে (`workers/services/price-alerts.ts`), যাতে চাপ দিলে নতুন দামই দেখায়। বন্ধ হয়ে যাওয়া ঠিকানা (404/410) মুছে যায়।
  - `public/sw.js` এ `push` আর `notificationclick`; চাপ দিলে শুধু নিজের সাইটের পথ খোলে।
  - iPhone এ শুধু Home Screen এ যোগ করা সাইটে চলে (iOS 16.4+), না হলে সেটাই বলে দেয়। ব্রাউজারে নোটিফিকেশন বন্ধ থাকলে সেটাও লেখে।
  - চালু করতে: `npx web-push generate-vapid-keys`, GitHub Variables এ `VAPID_PUBLIC_KEY`, Secrets এ `VAPID_PRIVATE_KEY`। না থাকলে বোতাম দেখায় না, worker পাঠায় না।
  - লোকালে টেস্ট: PGlite এ ১৮টা (সীমা, ঠিকানা যাচাই, স্টক, দিনে একবার), headless Chromium এ চালু/সেভ/বন্ধ আর service worker এ push দেখানো, লোকাল HTTPS সার্ভারে আসল এনক্রিপ্ট করা push আর 410।

## যা বাকি

- [ ] deploy করার পর Android Chrome আর iPhone Safari তে ইনস্টল করে দেখা, আর একটা আসল দাম-কমার নোটিফিকেশন।
- [ ] নতুন ভার্সন এলে "আপডেট আছে, রিফ্রেশ করুন" জানানো।
