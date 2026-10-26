// দোকান একই দেশ নানা বানানে লেখে (JP, Japan, Japan Version, Japanese); সাইট, worker আর অ্যাডমিন সবাই এই এক নামে মেলায়
const ALIASES: Record<string, string> = {
  jp: "Japan",
  jpn: "Japan",
  japan: "Japan",
  japanese: "Japan",
  us: "USA",
  usa: "USA",
  "u.s.": "USA",
  "u.s.a": "USA",
  "u.s.a.": "USA",
  "united states": "USA",
  america: "USA",
  american: "USA",
  uk: "UK",
  "united kingdom": "UK",
  britain: "UK",
  hk: "Hong Kong",
  "hong kong": "Hong Kong",
  hongkong: "Hong Kong",
  cn: "China",
  china: "China",
  chinese: "China",
  in: "India",
  ind: "India",
  india: "India",
  indian: "India",
  uae: "UAE",
  dubai: "UAE",
  emirates: "UAE",
  "middle east": "Middle East",
  me: "Middle East",
  sg: "Singapore",
  singapore: "Singapore",
  au: "Australia",
  aus: "Australia",
  australia: "Australia",
  ca: "Canada",
  canada: "Canada",
  kr: "Korea",
  korea: "Korea",
  korean: "Korea",
  vn: "Vietnam",
  vietnam: "Vietnam",
  my: "Malaysia",
  malaysia: "Malaysia",
  th: "Thailand",
  thailand: "Thailand",
  eu: "Europe",
  europe: "Europe",
  european: "Europe",
  global: "Global",
  international: "Global",
  int: "Global",
  intl: "Global",
  worldwide: "Global",
};

const NOISE = /\b(version|variant|model|unit|edition|region|set)\b|[()[\]]/gi;

// "JP/UAE" → "Japan/UAE", "Global Version" → "Global"; অচেনা নাম যেমন আছে তেমন থাকে
export function canonicalRegion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const names = raw
    .split(/\s*(?:\/|,|&|\||\+|\bor\b)\s*/i)
    .map((part) => part.replace(NOISE, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((part) => ALIASES[part.toLowerCase()] ?? part);
  return names.length ? [...new Set(names)].join("/") : null;
}

// ফিল্টার আর দেশের নোটের জন্য প্রথম দেশটাই ধরা হয়: "Japan/UAE" দেখায় "Japan" এর ঘরে
export const primaryRegion = (region: string | null | undefined) => canonicalRegion(region)?.split("/")[0] ?? null;
