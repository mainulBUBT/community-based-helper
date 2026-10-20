# ১৬ Deploy আর ডোমেইন

**অবস্থা:** ⬜ শুরু হয়নি

পুরো ধাপে ধাপে নির্দেশনা: [setup-guide.md](../setup-guide.md)। মালিকের ডোমেইন আছে।

## পরিকল্পনা

- Cloudflare Pages এ **নতুন** প্রজেক্ট (নাম `dordam`)। পুরনো `pothghat` প্রজেক্টে deploy করবেন না।
- `npm run build` এর `out/` ফোল্ডার upload: `npx wrangler pages deploy out --project-name dordam`।
- worker এর `rebuild` job প্রতি রাতে build করে deploy করতে পারে (GitHub secret এ Cloudflare token থাকলে)।

## ধাপ

1. [ ] ডেটাবেস চালু ([database](11-database.md))।
2. [ ] `.env.local` এ `NEXT_PUBLIC_SITE_URL=https://dordam.app`।
3. [ ] মালিকের অনুমতি নিয়ে প্রথম deploy।
4. [ ] Supabase Auth এ Site URL বসানো।
5. [ ] ডোমেইন কিনলে: Cloudflare Pages এ custom domain, `NEXT_PUBLIC_SITE_URL` বদল, আবার build আর deploy, Google Search Console এ sitemap।
6. [ ] বিকল্প হোস্ট (Vercel বা Netlify) রাখা, যদি বাংলাদেশে Cloudflare আটকায়। ডোমেইন থাকলে DNS বদলেই সরানো যাবে।

## মনে রাখার বিষয়

- এটা static সাইট, তাই সার্ভার চালানোর খরচ নেই।
- নতুন পণ্য আসলে পরের build এ তার পেজ তৈরি হয়। তার আগে লিংক খুললে ৪০৪।
