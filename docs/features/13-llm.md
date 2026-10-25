# ১৩ AI (OpenAI-compatible LLM)

**অবস্থা:** 🟡 আংশিক (সেটিংস আর worker এর কোড শেষ, key বসানো হয়নি)

## যা আছে

- যেকোনো OpenAI-compatible API চলে: Gemini, Groq, OpenRouter, Cloudflare Workers AI, Ollama। শুধু Base URL, মডেল আর key বদলালেই হয়।
- অ্যাডমিন → কাজ ও AI পেজে ঠিকানা, মডেল, key, আর "সংযোগ পরীক্ষা করুন" বোতাম (`src/services/admin/settings.ts` এর `testLlm`)। ব্রাউজার থেকে পরীক্ষা কিছু provider এ CORS এর কারণে কাজ না-ও করতে পারে, worker থেকে তখনো চলবে।
- প্রতিটা প্রোভাইডারের key আলাদা সেভ থাকে (Base URL ধরে, `private_settings.llmKeys`)। Gemini থেকে Groq এ গেলে Groq এর নিজের key লাগে, ফিরে এলে Gemini এর আগের key-ই চলে; একটার key বদলালে অন্যগুলো বদলায় না। key আছে এমন প্রোভাইডারের বোতামে ✓। worker সবসময় বাছাই করা প্রোভাইডারের key পায় (`llm.apiKey`)। (`20261025100000_llm-keys-per-provider.sql`)
- সেটিংস `private_settings.value.llm` এ, শুধু অ্যাডমিন পড়তে পারে।
- worker এ `workers/lib/llm.ts`: listing কোন পণ্যের সাথে মেলে (`lib/match.ts`, `lib/judge.ts`), পেজের লেখা থেকে দাম বের করা (`lib/extract.ts`)।
- মালিক নিজের OpenAI-compatible সাবস্ক্রিপশনের মডেল দেবেন। সার্ভিস `temperature` বা `response_format` না নিলে (400) worker এগুলো ছাড়া আবার চেষ্টা করে, তাই reasoning মডেলও চলে।
- ডেটাবেস ছাড়া পরীক্ষা: `.env.local` এ `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` দিলে worker সেগুলো পড়ে (DB থাকলে অ্যাডমিনের সেটিংস জেতে)। `npm run worker:dry` এর শেষ অংশে বিচারপতি পরীক্ষা চলে।

## যা বাকি

- [ ] নিজের সার্ভিসের Base URL, মডেল আর key অ্যাডমিনে বসানো।
- [ ] কয়েকটা পণ্যে মেলানো কতটা ঠিক হয় মেপে দেখা (৯০% লক্ষ্য)।
- [ ] এক provider এর কোটা শেষ হলে অন্যটায় যাওয়ার fallback।
