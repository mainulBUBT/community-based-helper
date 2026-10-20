# ১৭ ডেটার উৎস আর নিয়ম

**অবস্থা:** ✅ সিদ্ধান্ত নেওয়া (২০ অক্টোবর ২০২৬)

## যে দোকান থেকে দাম আসবে

| দোকান | পদ্ধতি | অবস্থা |
|---|---|---|
| Star Tech | search পেজের HTML | ✅ কাজ করে |
| Apple Gadgets | sitemap + পণ্যের পেজ (JSON-LD এ দাম ০, তাই HTML থেকে) | ✅ কাজ করে |
| Gadget & Gear | Playwright | ✅ কাজ করে |
| Pickaboo | `/search-result/<নাম>` HTML | ⛔ worker কে 403 দেয় |
| Telegram এর দোকান | দোকান নিজে পাঠায় | ⬜ [telegram](15-telegram-bot.md) |
| ক্রেতা | "দাম জানান" | 🟡 [price reports](05-price-reports.md) |

## যা নেওয়া হবে না, আর কেন

- **Daraz:** Terms of Use এর ২.E ধারায় দাম আর listing সংগ্রহ নিষেধ। affiliate চুক্তিতেও লিখিত অনুমতি ছাড়া দাম দেখানো নিষেধ।
- **Ryans:** robots.txt সব পেজ crawl করার অনুমতি দেয়, কিন্তু Cloudflare challenge দিয়ে আটকে রাখে। মালিকের সিদ্ধান্তে পুরোপুরি বাদ।
- **TechLand:** robots.txt পর্যন্ত আটকানো। বাদ।
- **Facebook group বা পেজ scrape:** নিয়মে নিষেধ, login লাগে। বাদ।
- **Google বা DuckDuckGo scrape:** bot challenge দেয়, নিয়মের বিরুদ্ধে। শুধু মাঝে মাঝে নতুন দোকান খুঁজতে ব্যবহার করা যায়।

## কঠিন নিয়ম

- bot protection, CAPTCHA, Cloudflare challenge ফাঁকি দেওয়ার কোড লেখা হবে না: stealth plugin, নকল fingerprint, residential proxy, কিছুই না। কোনো দোকান আটকালে সেই দোকান বাদ, অথবা তাদের কাছে অনুমতি বা feed চাওয়া।
- worker সবসময় নিজের পরিচয় দেওয়া user-agent ব্যবহার করবে।
- নতুন দোকান যোগের আগে তাদের Terms of Use আর robots.txt দেখে নিতে হবে।

## প্রতিযোগী

- **PC Graph** (pc-graph.onrender.com): PC যন্ত্রাংশ আর Mac, ১২টা দোকান, Ryans আর TechLand সহ। Mac এ সরাসরি প্রতিযোগী, মোবাইল আর ঘড়িতে নয়। সম্ভাব্য অংশীদার।
- **Price Monitor** (price-monitor.pro.bd): কম্পিউটার হার্ডওয়্যার।
- **MobileDokan:** মোবাইলের একটাই দাম দেখায়, দোকানভিত্তিক নয়।
- আগে ছিল, এখন বন্ধ: price.com.bd, dam.com.bd।

## আয়

- Star Tech affiliate: ৫%, bKash এ ৳১,০০০ হলে টাকা।
- পরে দোকানের কাছ থেকে "verified listing" এর জন্য টাকা।
