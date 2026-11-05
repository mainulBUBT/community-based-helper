# লোকাল রানার: GitHub যেসব দোকানে 403 পায় (ম্যাক, PC, ফোন)

দুটো জব: **`local_prices`** (দাম আপডেট) আর **`local_discover`** (নতুন পণ্য ওই দোকানগুলোতে খোঁজা)।

GitHub Actions এর সার্ভারের IP কিছু দোকান আটকায় (Cloudflare এর ডেটাসেন্টার-নিয়ম)। একই দোকান ঘরের IP থেকে, আমাদের সৎ `DordamBot` পরিচয়ে, ঠিকই খোলে। তাই এই দোকানগুলোর দাম আসে `local_prices` জবে, যা নিজের মেশিনে চলে আর অ্যাডমিন থেকে চালানো যায়।

- **কোন দোকান:** `workers/stores/local.ts` এর `LOCAL_HOSTS` (১৮টা, ~২,৭০০ অফার)। Chaldal বাদ: ঘরের IP থেকেও সংযোগ হয় না।
- **শুধু এখান থেকেই (৫ নভেম্বর, মালিকের সিদ্ধান্ত):** GitHub এর `prices` আর `discover` এই দোকানগুলোতে আর যায় না। তাই রানার বন্ধ থাকলে এদের দাম হালনাগাদ হয় না আর নতুন পণ্য খোঁজা হয় না।
- **কেন `local_discover` আলাদা:** GitHub এর `discover` এই দোকানগুলো ছাড়াই পণ্যকে "খোঁজা হয়েছে" চিহ্নিত করে; তাই লোকাল জব চিহ্ন নয়, নিজের শেষ সফল run এর পর যোগ হওয়া পণ্য ধরে। কোনো দোকান না হলে run ব্যর্থ, পরের বার একই পণ্য আবার।
- **কাজ:** `prices` এর একই কোড, শুধু ওই হোস্টের অফার (`LOCAL_JOB` env)। কোনো stealth নেই, নিজের পরিচয়, robots.txt মানা, আগের গতিসীমা। AI যাচাইও এখানে চলে, কারণ যাচাইয়ের সময় দোকানের পাতা খুলতে হয়, আর এই দোকানগুলোর পাতা GitHub থেকে খোলে না।
- **AI:** মেশিনে লগইন করা নিজের যেকোনো AI CLI, API key-এর সেটআপ নয়। `worker.env`-এ `LOCAL_AI_COMMAND`-এ command দিন; প্রশ্ন stdin-এ যায়, উত্তর stdout-এ আসে (`workers/lib/local-ai.ts`, একবারে একটা ডাক, run-এ সর্বোচ্চ ২০০টা)। না দিলে, CLI না চললে বা সীমা শেষ হলে বাকি run AI ছাড়াই চলে।
  - **নিরাপত্তা:** দোকানের লেখা এতে ঢোকে। Command repo-র বাইরে চলে আর service key পায় না, কিন্তু টুল বন্ধ রাখা command-এর দায়িত্ব। টুল খোলা থাকলে দোকানের পাতার লেখা AI-কে দিয়ে মেশিনে কিছু করাতে পারে, `worker.env`-ও পড়াতে পারে।
  - **Claude:** `LOCAL_AI_COMMAND='claude -p --model haiku --tools "" --no-session-persistence --strict-mcp-config --setting-sources "" --system-prompt "Follow the task in the input. Reply with JSON only."'` (`claude` PATH-এ না থাকলে পুরো পথ)
  - **অন্য CLI:** আগে দেখে নিন stdin থেকে পড়ে কি না আর টুল বন্ধ করা যায় কি না।

## চালানোর ধরন
1. **একবার:** `sh scripts/local-worker.sh local_prices` বা `local_discover`
2. **রানার (অ্যাডমিনের অনুরোধ ধরে):** `sh scripts/local-runner.sh` (প্রতি মিনিটে `jobs` দেখে; অ্যাডমিনে "এখনই চালান" চাপলে, বা নতুন পণ্য এলে `local_discover` নিজে চালায়)
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
