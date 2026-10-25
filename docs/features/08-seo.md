# ০৮ SEO

**অবস্থা:** 🟡 আংশিক (কোড শেষ, ডোমেইন আর নিয়মিত rebuild বাকি)

## যা আছে

- `next build` প্রতিটা পণ্য (`/product/<slug>/`) আর বিক্রেতার (`/seller/<id>/`) আলাদা static HTML বানায় (`generateStaticParams`)। তাই Cloudflare Pages এ রাখলেও Google পুরো পেজ পড়তে পারে।
- English এর আসল পেজ: `src/app/en/` গাছ প্রতিটা পাতার English HTML prerender করে ([i18n](06-i18n-theme.md))।
- **তিনটা root layout** (`(site)`, `en`, `admin`), সবাই `components/layout/RootDocument.tsx` দিয়ে: স্ট্যাটিক HTML এই `<html lang="bn">` বা `lang="en"`। ভাষা বদলালে পুরো পেজ রিলোড হয়। ভুল ঠিকানায় দুই ভাষার `app/global-not-found.tsx` (`experimental.globalNotFound`)।
- **সব পেজের metadata এক জায়গা থেকে:** `lib/page-meta.ts` এর `pageMeta()`: canonical, `bn`/`en`/`x-default` hreflang, Open Graph (পণ্য আর ক্যাটাগরিতে পণ্যের ছবি, বাকিতে লোগো), Twitter card। শিরোনাম আর বর্ণনার লেখা `i18n` এর `seo` অংশে ("বাংলাদেশে … এর দাম", "… Price in Bangladesh")।
- **bn আর en রুট একই কোড:** পণ্য, ক্যাটাগরি আর বিক্রেতার কাজ `ProductRoute.tsx`, `CategoryRoute.tsx`, `SellerRoute.tsx` এ; `page.tsx` গুলো শুধু ভাষা দিয়ে ডাকে।
- **JSON-LD** (`utils/structured-data.ts`, `components/ui/JsonLd.tsx`): হোমে WebSite (Google এর সাইট-সার্চ বক্স) আর Organization, পণ্যে Product আর BreadcrumbList, ক্যাটাগরিতে BreadcrumbList আর ItemList।
- **ক্যাটাগরি পেজের HTML এ আসল পণ্য:** ফিল্টার ব্রাউজারে চালু হওয়ার আগে Suspense fallback (`components/search/StaticResults.tsx`) প্রথম ২৪টা পণ্য দেখায়; তারপর একই লিস্টে ফিল্টার চলে, পুরো ক্যাটালগ নামায় না।
- `src/app/sitemap.ts` আর `src/app/robots.ts`। sitemap এ প্রতিটা পেজ দুই ভাষায় আলাদা সারি, প্রতিটায় `bn`/`en`/`x-default`। `/admin/` index বন্ধ, সেভ করা পেজ noindex।
- হোমের SEO শিরোনাম আর বর্ণনা অ্যাডমিন → সেটিংস থেকে বদলায়, সাথে Google এ কেমন দেখাবে তার preview।
- সাইটের ঠিকানা `NEXT_PUBLIC_SITE_URL` থেকে (`src/config/site.ts`)।

## যা বাকি

- [ ] নতুন পণ্য আসলে আবার build লাগে। worker এর `rebuild` job প্রতি রাতে এটা করবে। GitHub secret বসিয়ে চালু করতে হবে ([deploy](16-deploy.md))।
- [ ] ডোমেইন কিনলে `NEXT_PUBLIC_SITE_URL` বদলে আবার build, তারপর Google Search Console এ sitemap জমা।
- [x] Open Graph ছবি: পণ্যের প্রথম ছবি (২৫ অক্টোবর)।
- [x] ২৫ অক্টোবরের নিজের SEO audit (৩৫০টা পেজ): Product JSON-LD এ বর্ণনা, দাম না থাকলে Product ডেটা বাদ (Google এর নিয়ম), লম্বা নামে ছোট শিরোনাম, গ্যালারির ছবিতে alt, search পেজ `noindex, follow` আর sitemap থেকে বাদ, sitemap এ আসল `lastmod` (দাম শেষ কবে যাচাই), `og:locale:alternate`, পণ্যের মূল ছবি `fetchpriority=high`, carousel এর শুধু প্রথম ৫টা ছবি সাথে সাথে, ভাষা বদলের লিংক 404/অফলাইনে হোমে যায়। পাবলিক পেজ আর supabase-js নামায় না (ভিউ আর দাম জমা সরাসরি fetch), JS ৮৯৪ থেকে ৬৫৭ KB।
- [ ] ২৮টা পণ্যের ছবি নেই (দুই ভাষায় ৫৬ পেজ); ছবি না থাকলে Google Images আর শেয়ারে কিছু দেখায় না।
- [ ] deploy এর পর Google Rich Results Test আর PageSpeed Insights এ একটা পণ্যের পেজ চালিয়ে দেখা।
