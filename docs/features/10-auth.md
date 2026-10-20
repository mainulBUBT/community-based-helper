# ১০ লগইন

**অবস্থা:** ⛔ আটকে আছে (কোড শেষ, Supabase প্রজেক্ট নেই)

## যা আছে

- `src/services/admin/auth.ts`: Supabase ইমেইল-পাসওয়ার্ড লগইন। লগইনের পর `is_admin()` মিলিয়ে দেখে, অ্যাডমিন না হলে বের করে দেয়।
- "পাসওয়ার্ড ভুলে গেছেন": ইমেইলে লিংক যায় (`redirectTo: /admin/`)। লিংকে এলে নতুন পাসওয়ার্ডের ফর্ম দেখায় (`PASSWORD_RECOVERY` ইভেন্ট)।
- Supabase না থাকলে ডেমো লগইন। ইমেইল আর পাসওয়ার্ড `.env.example` এর `NEXT_PUBLIC_DEMO_ADMIN_*` থেকে।
- সাধারণ ইউজারের লগইন নেই, দরকারও নেই।

## অ্যাডমিন বানানোর ধাপ (প্রজেক্ট খোলার পর)

1. Supabase ড্যাশবোর্ড → Authentication → Users → Add user। মালিক নিজে নিজের ইমেইল আর পাসওয়ার্ড দেবেন। পাসওয়ার্ড এজেন্ট বানাবে না।
2. SQL Editor এ:
   ```sql
   insert into admins (user_id)
   select id from auth.users where email = '<মালিকের ইমেইল>';
   ```
3. Authentication → URL Configuration এ Site URL আর `<সাইট>/admin/` redirect যোগ।

## যা বাকি

- [ ] ⛔ Supabase প্রজেক্ট ([database](11-database.md))।
- [ ] ওপরের ধাপগুলো।
- [ ] আসল লগইন, ভুলে যাওয়া পাসওয়ার্ড আর বের হওয়া পরীক্ষা।
