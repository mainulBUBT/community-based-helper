# লোকাল রানার: GitHub যেসব দোকানে 403 পায় (ম্যাক, PC, ফোন)

GitHub Actions এর সার্ভারের IP কিছু দোকান আটকায় (Cloudflare এর ডেটাসেন্টার-নিয়ম)। একই দোকান ঘরের IP থেকে, আমাদের সৎ `DordamBot` পরিচয়ে, ঠিকই খোলে। তাই এই দোকানগুলোর দাম আসে `local_prices` জবে, যা নিজের মেশিনে চলে আর অ্যাডমিন থেকে চালানো যায়।

- **কোন দোকান:** `workers/stores/local.ts` এর `LOCAL_HOSTS` (১৮টা, ~২,৭০০ অফার)। Chaldal বাদ: ঘরের IP থেকেও সংযোগ হয় না।
- **কাজ:** `prices` এর একই কোড, শুধু ওই হোস্টের অফার (`PRICES_ONLY` env)। কোনো stealth নেই, নিজের পরিচয়, robots.txt মানা, আগের গতিসীমা।

## চালানোর ধরন
1. **একবার:** `sh scripts/local-worker.sh local_prices`
2. **রানার (অ্যাডমিনের অনুরোধ ধরে):** `sh scripts/local-runner.sh` (প্রতি মিনিটে `jobs` দেখে; অ্যাডমিনে "এখনই চালান" চাপলে চালায়)
3. **নিজে থেকেও:** `sh scripts/local-runner.sh --every 4` (অনুরোধ ছাড়াও প্রতি ৪ ঘণ্টা)

অ্যাডমিন → জব-তালিকায় **"আটকানো দোকানের দাম (লোকাল)"** নামে সারি; "এখনই চালান" চাপলে রানার ১ মিনিটের মধ্যে ধরে, ফল ওই সারিতে ও `job_runs` এ।

## মেশিন ভেদে
| | সেটআপ |
|---|---|
| ম্যাক / Linux | Node.js ২২, `npm ci`, `~/.config/dordam/worker.env` (SUPABASE_URL, SUPABASE_SERVICE_KEY) |
| PC (Windows) | একই; `npm run local:runner` (sh-এর বদলে) |
| ফোন (Android, Termux) | `pkg install nodejs git`, প্রজেক্ট clone, `npm ci`, `termux-wake-lock`; **অপরীক্ষিত** |

## সাবধানতা
- **service_role key** পুরো ডেটাবেসের অধিকার দেয়; ফোন/PC তে রাখলে হারালে ঝুঁকি। সীমিত অধিকারের আলাদা key ভালো।
- **একই দোকান একসাথে দুই মেশিন থেকে নয়**: একটা রানারই চালান।
- রানার বন্ধ থাকলে অনুরোধ পড়ে থাকে (আগে `run_requested_at` বসে, পরে চালু করলে ধরে)।

## একবারের সেটআপ (DB)
`supabase/batches/2026-11-04-local-prices-job.sql` একবার চালাতে হবে: নতুন `local_prices` সারি, আর `dispatch_job` ফাংশনকে লোকাল জব ছেড়ে দেওয়া (নইলে অনুরোধে GitHub-কে অকারণে ডাকে)।
`npx supabase db query --linked -f supabase/batches/2026-11-04-local-prices-job.sql`
