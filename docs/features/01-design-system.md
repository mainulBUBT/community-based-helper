# ০১ ডিজাইন সিস্টেম

**অবস্থা:** ✅ শেষ

## যা আছে

- e-commerce ধাঁচ: সাদা কার্ড, হালকা ঘিয়ে ব্যাকগ্রাউন্ড, উপরে সার্চবার, তার নিচে নেভি ক্যাটাগরি স্ট্রিপ, মোবাইলে নিচে মেনু।
- **মূল রং:** গাঢ় নেভি `#1f2f55`। **অফার আর ছাড়:** হালকা সোনালি `#9a6b1f`। চোখে লাগে না এমন রং বেছে নেওয়া হয়েছে।
- কোণ কম গোল: কার্ড আর প্যানেলে `rounded-lg` (৮px), ছোট বোতাম আর ঘরে `rounded-md`।
- ফন্ট: Hind Siliguri (বাংলা আর ইংরেজি দুটোই)।
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
- [ ] আসল পণ্যের ছবি এলে `ProductIcon` এর জায়গায় ছবি দেখানো।
