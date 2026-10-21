# ১৬ Deploy আর ডোমেইন

**অবস্থা:** 🟡 সাইট `https://dordam.app` এ চালু, SEO লিংক ঠিক; Supabase Auth URL আর Search Console বাকি

পুরো ধাপে ধাপে নির্দেশনা: [setup-guide.md](../setup-guide.md)। ডোমেইন `dordam.app`, nameserver Cloudflare এ।

## পরিকল্পনা

- Cloudflare Pages এ **নতুন** প্রজেক্ট (নাম `dordam`)। পুরনো `pothghat` প্রজেক্টে deploy করবেন না।
- `npm run build` এর `out/` ফোল্ডার upload: `npx wrangler pages deploy out --project-name dordam`।
- worker এর `rebuild` job প্রতি রাতে build করে deploy করতে পারে (GitHub secret এ Cloudflare token থাকলে)।

## ধাপ

1. [x] ডেটাবেস চালু ([database](11-database.md))।
2. [x] Cloudflare Pages প্রজেক্ট `dordam` খোলা।
3. [x] প্রথম deploy, `https://dordam.pages.dev` এ সাইট।
4. [x] ডোমেইন: nameserver Cloudflare এ, Pages এ `dordam.app` custom domain, `www.dordam.app` → `dordam.app`। পুরো ধাপ [setup-guide ধাপ ৫](../setup-guide.md)।
5. [x] **SEO:** GitHub → Actions → **Variables** → `SITE_URL = https://dordam.app`, তারপর `rebuild` (#3, ২০২৬-১০-২১)। live `robots.txt`, `sitemap.xml` আর `<link rel="canonical">` এখন `dordam.app`। repo তে `.env.local` আর `supabase/config.toml` ও `dordam.app`।
6. [ ] Supabase Auth Site URL / Redirect URL। Turnstile widget এ `dordam.app`, `dordam.pages.dev`, `localhost` আছে ✅ (subdomain যেমন `www` নিজে থেকে এর আওতায়)।
7. [ ] Google Search Console (Domain property, Cloudflare DNS এ TXT) আর sitemap জমা, ধাপ ৫ এর পরে।
8. [ ] বিকল্প হোস্ট (Vercel বা Netlify) রাখা, যদি বাংলাদেশে Cloudflare আটকায়। DNS Cloudflare এ, তাই শুধু `dordam.app` এর রেকর্ড নতুন হোস্টে দেখালেই সরানো যাবে।

## মনে রাখার বিষয়

- এটা static সাইট, তাই সার্ভার চালানোর খরচ নেই।
- নতুন পণ্য আসলে পরের build এ তার পেজ তৈরি হয়। তার আগে লিংক খুললে ৪০৪।
