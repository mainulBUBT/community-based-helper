# ০১ ডিজাইন সিস্টেম

**অবস্থা:** ✅ শেষ

## যা আছে

- e-commerce ধাঁচ: সাদা কার্ড, হালকা ঘিয়ে ব্যাকগ্রাউন্ড, উপরে সার্চবার, তার নিচে টিল ক্যাটাগরি স্ট্রিপ (১২৮০px এর কম চওড়ায়), মোবাইলে নিচে মেনু। header, স্ট্রিপ, মূল অংশ আর footer সব একই `page-container` এ (সর্বোচ্চ ১২৯০px, দুই পাশে ১৬px; 6valley এর মতো), পেছনের রং পুরো চওড়া।
- **মূল রং:** টিল `#0f766e` (dark mode এ `#4fd1c5`): header এর বার, লিংক, বাছাই করা ঘর। **কেনার বোতাম ("দোকানে যান"):** কোরাল `#e11d48` (`--color-cta`)। **অফার আর সতর্কতা:** অ্যাম্বার `#d97706`। **footer আর হোম হিরো:** গাঢ় টিল `#134e4a`। সব জুটির contrast ৪.৫ এর বেশি। অ্যাপ আইকন টিল, তাতে কোরাল বিন্দু।
- কোণ কম গোল: কার্ড আর প্যানেলে `rounded-lg` (৮px), ছোট বোতাম আর ঘরে `rounded-md`।
- ফন্ট: ইংরেজি আর সংখ্যায় Inter, বাংলায় Noto Sans Bengali (`src/app/layout.tsx`)।
- ছাড়ের ব্যাজ লাল (`--color-sale`), "স্টকে আছে" সবুজ, অফারের লেখা গাঢ় সোনালি। প্রধান বোতাম টিল, কেনার বোতাম কোরাল।
- ডিফল্ট লাইট মোড, ডার্ক মোডের জন্য একই টোকেনের `light-dark()` মান।
- মোবাইলে ফুটার লুকানো, শুধু বড় স্ক্রিনে দেখায়।

## ফাইল

- `src/app/globals.css`: সব রঙের টোকেন (`--color-brand`, `--color-gold`, `--color-surface` …)
- `src/components/ui/*`: Badge, Chip, SectionHeader, EmptyState, Skeleton, Toaster, ErrorNotice, Notices
- `src/components/layout/*`: AppShell, SiteFooter, BrandMark, PageHeader, PreferenceButtons
- `public/icons/*`: অ্যাপ আইকন (svg আর png)

## নিয়ম

- রং সবসময় টোকেন দিয়ে (`bg-brand`, `text-dim` …), হেক্স হার্ডকোড নয়।
- আইকন lucide-react থেকে, ইমোজি নয়।
- টেক্সট আর ব্যাকগ্রাউন্ডের কন্ট্রাস্ট অন্তত 4.5:1।

## যা বাকি

- [ ] লোগো বদলালে `public/icons/` এর png আবার বানানো। macOS এ `qlmanage -t -s 512` দিয়ে svg থেকে png হয়।
- [ ] আসল পণ্যের ছবি এলে গ্যালারির প্লেসহোল্ডার আইকনের জায়গায় ছবি দেখানো (UI তৈরি: `ProductGallery`; DB কলাম আর worker এর পথ তৈরি, ছবি আসবে ডেটাবেস চালু হলে)।
