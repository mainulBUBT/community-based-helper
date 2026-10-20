# ০৮ SEO

**অবস্থা:** 🟡 আংশিক (কোড শেষ, ডোমেইন আর নিয়মিত rebuild বাকি)

## যা আছে

- `next build` প্রতিটা পণ্য (`/product/<slug>/`) আর বিক্রেতার (`/seller/<id>/`) আলাদা static HTML বানায় (`generateStaticParams`)। তাই Cloudflare Pages এ রাখলেও Google পুরো পেজ পড়তে পারে।
- প্রতিটা পণ্যের পেজে title, description, canonical আর Open Graph। JSON-LD `Product` + `AggregateOffer` (সবচেয়ে কম আর বেশি দাম, দোকান সংখ্যা, BDT)।
- `src/app/sitemap.ts` আর `src/app/robots.ts`। `/admin/` index বন্ধ।
- হোমের SEO শিরোনাম আর বর্ণনা অ্যাডমিন → সেটিংস থেকে বদলায়, সাথে Google এ কেমন দেখাবে তার preview।
- সাইটের ঠিকানা `NEXT_PUBLIC_SITE_URL` থেকে (`src/config/site.ts`)।

## যা বাকি

- [ ] নতুন পণ্য আসলে আবার build লাগে। worker এর `rebuild` job প্রতি রাতে এটা করবে। GitHub secret বসিয়ে চালু করতে হবে ([deploy](16-deploy.md))।
- [ ] ডোমেইন কিনলে `NEXT_PUBLIC_SITE_URL` বদলে আবার build, তারপর Google Search Console এ sitemap জমা।
- [ ] আসল পণ্যের ছবি এলে Open Graph ছবি।
