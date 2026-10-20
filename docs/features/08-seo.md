# ০৮ SEO

**অবস্থা:** 🟡 আংশিক (কোড শেষ, ডোমেইন আর নিয়মিত rebuild বাকি)

## যা আছে

- `next build` প্রতিটা পণ্য (`/product/<slug>/`) আর বিক্রেতার (`/seller/<id>/`) আলাদা static HTML বানায় (`generateStaticParams`)। তাই Cloudflare Pages এ রাখলেও Google পুরো পেজ পড়তে পারে।
- English এর আসল পেজ: `src/app/en/` গাছ প্রতিটা পাতার English HTML prerender করে ([i18n](06-i18n-theme.md))। প্রতি জোড়া পেজে hreflang — বাংলা পেজে `alternates.languages`, English পেজে `enMeta()` (`src/lib/en-meta.ts`, canonical সহ)।
- `src/app/sitemap.ts` আর `src/app/robots.ts`। sitemap এ প্রতি URL এর সাথে বাংলা-English `xhtml:link` জোড়া। `/admin/` index বন্ধ।
- হোমের SEO শিরোনাম আর বর্ণনা অ্যাডমিন → সেটিংস থেকে বদলায়, সাথে Google এ কেমন দেখাবে তার preview।
- সাইটের ঠিকানা `NEXT_PUBLIC_SITE_URL` থেকে (`src/config/site.ts`)।

## যা বাকি

- [ ] নতুন পণ্য আসলে আবার build লাগে। worker এর `rebuild` job প্রতি রাতে এটা করবে। GitHub secret বসিয়ে চালু করতে হবে ([deploy](16-deploy.md))।
- [ ] ডোমেইন কিনলে `NEXT_PUBLIC_SITE_URL` বদলে আবার build, তারপর Google Search Console এ sitemap জমা।
- [ ] আসল পণ্যের ছবি এলে Open Graph ছবি।
