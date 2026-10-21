# ১৬ Deploy আর ডোমেইন

**অবস্থা:** 🟡 Pages প্রজেক্ট খোলা, deploy আর ডোমেইন বাকি

পুরো ধাপে ধাপে নির্দেশনা: [setup-guide.md](../setup-guide.md)। মালিকের ডোমেইন আছে।

## পরিকল্পনা

- Cloudflare Pages এ **নতুন** প্রজেক্ট (নাম `dordam`)। পুরনো `pothghat` প্রজেক্টে deploy করবেন না।
- `npm run build` এর `out/` ফোল্ডার upload: `npx wrangler pages deploy out --project-name dordam`।
- worker এর `rebuild` job প্রতি রাতে build করে deploy করতে পারে (GitHub secret এ Cloudflare token থাকলে)।

## ধাপ

1. [x] ডেটাবেস চালু ([database](11-database.md))।
2. [x] Cloudflare Pages প্রজেক্ট `dordam` খোলা।
3. [ ] প্রথম deploy (Actions → `rebuild`), `https://dordam.pages.dev` এ সাইট দেখা।
4. [ ] ডোমেইন: DNS বিক্রেতার কাছেই থাকবে, তাই মূল সাইট `www.dordam.app` (CNAME → `dordam.pages.dev`)। পুরো ধাপ [setup-guide ধাপ ৫](../setup-guide.md)।
5. [ ] `dordam.app` (www ছাড়া): ALIAS রেকর্ড, নয়তো HTTPS forwarding দিয়ে www এ পাঠানো।
6. [ ] `NEXT_PUBLIC_SITE_URL = https://www.dordam.app` (GitHub secret, `.env.local`), আবার build।
7. [ ] Supabase Auth Site URL / Redirect URL, Turnstile এর ডোমেইন তালিকা।
8. [ ] মূল ডোমেইন না খুললে bot এর পরিচয়ের লিংক (`workers/lib/agent.ts`) আর `src/config/site.ts` এর ডিফল্ট `SITE_URL` www এ আনা।
9. [ ] Google Search Console (URL prefix property) আর sitemap জমা।
10. [ ] বিকল্প হোস্ট (Vercel বা Netlify) রাখা, যদি বাংলাদেশে Cloudflare আটকায়। DNS বিক্রেতার কাছে থাকায় শুধু CNAME বদলালেই সরানো যাবে।

## মনে রাখার বিষয়

- এটা static সাইট, তাই সার্ভার চালানোর খরচ নেই।
- নতুন পণ্য আসলে পরের build এ তার পেজ তৈরি হয়। তার আগে লিংক খুললে ৪০৪।
