import { toBnDigits } from "./format";

// অনেকে বাংলায় লিখে খোঁজেন ("আইফোন ১৭ দাম"); পরিচিত ব্র্যান্ড আর মডেলের শব্দের বাংলা উচ্চারণ
const WORDS: Record<string, string> = {
  apple: "অ্যাপল",
  samsung: "স্যামসাং",
  xiaomi: "শাওমি",
  realme: "রিয়েলমি",
  oppo: "অপো",
  vivo: "ভিভো",
  oneplus: "ওয়ানপ্লাস",
  google: "গুগল",
  huawei: "হুয়াওয়ে",
  sony: "সনি",
  anker: "অ্যাঙ্কার",
  jbl: "জেবিএল",
  lenovo: "লেনোভো",
  hp: "এইচপি",
  dell: "ডেল",
  asus: "আসুস",
  lg: "এলজি",
  amazfit: "অ্যামাজফিট",
  oraimo: "ওরাইমো",
  baseus: "বেসিয়াস",
  haylou: "হাইলু",
  kospet: "কসপেট",
  iphone: "আইফোন",
  ipad: "আইপ্যাড",
  macbook: "ম্যাকবুক",
  mac: "ম্যাক",
  imac: "আইম্যাক",
  airpods: "এয়ারপডস",
  watch: "ওয়াচ",
  galaxy: "গ্যালাক্সি",
  buds: "বাডস",
  redmi: "রেডমি",
  note: "নোট",
  pixel: "পিক্সেল",
  nord: "নর্ড",
  reno: "রেনো",
  nova: "নোভা",
  pro: "প্রো",
  max: "ম্যাক্স",
  plus: "প্লাস",
  ultra: "আল্ট্রা",
  air: "এয়ার",
  mini: "মিনি",
  lite: "লাইট",
  neo: "নিও",
  active: "অ্যাকটিভ",
  fit: "ফিট",
  series: "সিরিজ",
};

// "Apple iPhone 17 Pro" → "অ্যাপল আইফোন ১৭ প্রো"; ব্র্যান্ডের বাংলা না জানলে null (স্কিনকেয়ার, স্নিকার্সে আন্দাজে বানানো হয় না)
export function banglaName(brand: string, name: string): string | null {
  if (!WORDS[brand.toLowerCase()]) return null;
  const words = `${brand} ${name}`.split(/\s+/).map((word) => WORDS[word.toLowerCase()] ?? (/^\d+$/.test(word) ? toBnDigits(word) : word));
  return words.join(" ");
}

// বাংলা শব্দে "মোবাইলের", "মধুর"; ইংরেজি নাম বা বন্ধনীতে শেষ হলে আলাদা "এর"
export function withEr(word: string): string {
  const last = word.trim().slice(-1);
  if (!/[\u0980-\u09FF]/.test(last)) return `${word} এর`;
  return /[\u0985-\u0994\u09BE-\u09CC]/.test(last) ? `${word}র` : `${word}ের`;
}
