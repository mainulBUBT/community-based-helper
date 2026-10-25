# ০৭ PWA

**অবস্থা:** 🟡 আংশিক (কোড শেষ, আসল ফোনে ইনস্টল করে দেখা হয়নি)

## যা আছে

- `src/app/manifest.ts`: নাম, রং, আইকন (192, 512, maskable), শর্টকাট (খুঁজুন, সেভ করা)।
- `public/sw.js`: `_next/static` আর আইকন cache থেকে দেয় (সর্বোচ্চ ২০০টা)। পেজ আর `/data/catalog/*.json` নেটওয়ার্ক থেকে আনে, না পেলে cache (সর্বোচ্চ ৮০টা), পেজ তাও না পেলে `/offline/`। তাই অফলাইনেও খোঁজা আর সেভ করা চলে। `/admin` কখনো cache হয় না।
- `src/components/layout/ServiceWorker.tsx`: শুধু production build এ service worker চালু করে।
- হেডারে "অ্যাপ নামান" বোতাম, ব্রাউজার অনুমতি দিলে তবেই দেখায় (`src/hooks/useInstallPrompt.ts`)।

## যা বাকি

- [ ] deploy করার পর Android Chrome আর iPhone Safari তে ইনস্টল করে দেখা।
- [ ] নতুন ভার্সন এলে "আপডেট আছে, রিফ্রেশ করুন" জানানো।
- [ ] Web push দিয়ে "দাম কমেছে" নোটিফিকেশন।
