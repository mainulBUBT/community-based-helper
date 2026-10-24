# ০৬ বাংলা/English আর লাইট/ডার্ক

**অবস্থা:** ✅ শেষ

## যা আছে

- ডিফল্ট বাংলা। হেডারের বোতামে English। পছন্দ localStorage এ থাকে (`src/lib/preferences.ts`)।
- English এর আলাদা SEO পেজ: আসল `src/app/en/` গাছ (layout + হোম, search, sellers, saved, about, প্রতিটা পণ্য ও বিক্রেতা) — build এই সব পেজ English HTML হিসেবে prerender হয়। গাছের ভেতরে `LocaleProvider` (`src/lib/locale.tsx`) ভাষা "en" জোর করে ধরে রাখে, তাই ব্যবহারকারীর localStorage পছন্দে ওরা বদলায় না।
- ভেতরের লিংকে `useI18n()` এর `prefix` ("" বাংলায়, "/en" English এ) — সব কার্ড, View, নেভ একই কম্পোনেন্ট দুই গাছে চলে।
- প্রতি জোড়া পেজে hreflang: বাংলা পেজের metadata তে `alternates.languages { bn, en }`, English পেজে `enMeta()` (`src/lib/en-meta.ts`, canonical সহ)। `sitemap.xml` এ প্রতি URL এ `xhtml:link` জোড়া।
- `/en` পাতায় ভাষা-বোতাম একই পাথের বাংলা URL এ `Link`; বাংলা পাতায় আগের তাৎক্ষণিক টগল। পেজ আঁকার আগেই inline script পাথ দেখে `<html lang>` ঠিক করে (`preferencesInitScript`)।
- সাইটের নামের English রূপ সেটিংসে (`nameEn`, ডিফল্ট "Dordam") — `/en` এর টাইটেল, হেডার, ফুটারে ব্যবহার হয়।
- অ্যাডমিন প্যানেলের আলাদা পছন্দ: **ডিফল্ট English**, বোতামে বাংলা — `adminLangStore`/`setAdminLang` (`src/lib/preferences.ts`), হুক `useAdminI18n()`; লেখা `src/i18n/*.ts` এর `admin` অংশে ([admin panel](09-admin-panel.md))।
- সব লেখা `src/i18n/bn.ts` আর `src/i18n/en.ts` এ। `en.ts` এর ধরন `bn.ts` থেকে আসে, তাই কোনো চাবি বাদ পড়লে typecheck আটকায়।
- `useI18n()` (`src/hooks/useI18n.ts`) দেয় `t` (লেখা), `num` (বাংলায় সংখ্যা বাংলা অঙ্কে), `ago` ("২ ঘণ্টা আগে"), `prefix`।
- দাম ভাষা অনুযায়ী অঙ্কে: বাংলায় `৳১,০৭,৯৯৯`, English-এ `৳1,07,999` (`formatTaka(amount, lang)`); গোনা সংখ্যা বাংলায় (`৪টা দোকানে`)।
- ডিফল্ট লাইট মোড। বোতামে ডার্ক মোড, পছন্দ মনে রাখে। পেজ আঁকার আগেই `<body>` এর একেবারে শুরুতে ছোট inline script থিম বসায় (`next/script` এখানে চলবে না — hydration এর পরে চলে, তখন ঝলক দেখা যায়), তাই ঝলক দেখা যায় না।

## যা বাকি

- [ ] `/en` পাতাগুলোর লেখা বাড়ার সাথে মানিয়ে দেখা (বিশেষত hero আর about)।
