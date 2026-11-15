import type { KeySpec } from "@/utils/specs";

type Better = "higher" | "lower";
type Pick = "first" | "max";

interface Rule {
  pattern: RegExp;
  better: Better;
  pick: Pick;
  bar?: boolean;
  clean?: RegExp;
  family?: RegExp;
}

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;
const TOUCH_SAMPLING = /\d+(?:\.\d+)?\s*Hz\s*touch[\w\s-]*|touch[\w\s-]*?\d+(?:\.\d+)?\s*Hz/gi;
const OS_NAMES = String.raw`(ios|ipados|watchos|android|wear\s?os|harmonyos|hyperos|one\s?ui|hello\s?ui)`;

// ক্যামেরার MP আর প্রসেসরের নাম দেখে ভালো-মন্দ বলা যায় না, তাই ওগুলোর নিয়ম নেই
const RULES: Partial<Record<KeySpec, Rule>> = {
  display: { pattern: new RegExp(`${NUMBER}\\s*Hz`, "gi"), better: "higher", pick: "max", bar: true, clean: TOUCH_SAMPLING },
  // iPhone-এর ঘরে Nano SIM আর eSIM মডেলের দুটো সংখ্যা থাকে; সব iPhone-এ প্রথমটা Nano SIM-এর, তাই প্রথমটাই
  battery: { pattern: new RegExp(`${NUMBER}\\s*mAh`, "gi"), better: "higher", pick: "first", bar: true },
  charging: { pattern: new RegExp(`${NUMBER}\\s*W\\b`, "gi"), better: "higher", pick: "max", bar: true },
  // সর্বোচ্চ প্রজন্মই আসল সুবিধা (5G বনাম 4G); বাড়তি 2G সমর্থন নয়
  network: { pattern: /(\d)G\b/gi, better: "higher", pick: "max" },
  os: { pattern: new RegExp(`${OS_NAMES}\\s*${NUMBER}`, "gi"), better: "higher", pick: "first", family: new RegExp(OS_NAMES, "i") },
  // IP68-এর দ্বিতীয় অঙ্ক পানি-রোধের মাত্রা
  water: { pattern: /IP[\dX](\d)/gi, better: "higher", pick: "max" },
  weight: { pattern: new RegExp(`${NUMBER}\\s*g\\b`, "gi"), better: "lower", pick: "first" },
};

export function bestOf(values: (number | null)[], better: Better): number[] {
  const present = values.flatMap((value, index) => (value === null ? [] : [{ value, index }]));
  if (present.length < 2) return [];
  const pick = better === "higher" ? Math.max : Math.min;
  const best = pick(...present.map((p) => p.value));
  const winners = present.filter((p) => p.value === best).map((p) => p.index);
  return winners.length === present.length ? [] : winners;
}

function readSpec(rule: Rule, value?: string): number | null {
  if (!value) return null;
  const text = rule.clean ? value.replace(rule.clean, " ") : value;
  const numbers = [...text.matchAll(rule.pattern)].map((m) => Number(m[m.length - 1]));
  if (!numbers.length) return null;
  return rule.pick === "max" ? Math.max(...numbers) : numbers[0];
}

const familyOf = (rule: Rule, value?: string) => (value && rule.family ? (rule.family.exec(value)?.[1].replace(/\s/g, "").toLowerCase() ?? null) : null);

// iOS 26 আর Android 16 এর সংখ্যা মেলানো যায় না: আলাদা পরিবার হলে কাউকে ধরা হয় না
export function specNumbers(key: KeySpec, values: (string | undefined)[]): (number | null)[] {
  const rule = RULES[key];
  if (!rule) return values.map(() => null);
  if (rule.family && new Set(values.map((v) => familyOf(rule, v)).filter(Boolean)).size > 1) return values.map(() => null);
  return values.map((v) => readSpec(rule, v));
}

export const hasBar = (key: KeySpec) => Boolean(RULES[key]?.bar);

export function specWinners(key: KeySpec, numbers: (number | null)[]): number[] {
  const rule = RULES[key];
  return rule ? bestOf(numbers, rule.better) : [];
}

const SIZE_UNITS: Record<string, [string, number]> = { tb: ["gb", 1024], gb: ["gb", 1], l: ["ml", 1000], ml: ["ml", 1], kg: ["g", 1000], g: ["g", 1] };

// "8GB/256GB" → "256gb", "1TB" → "1024gb", "150ml" → "150ml"; RAM-এর চেয়ে স্টোরেজ বড় বলে সবচেয়ে বড় মানটা নিই
export function sizeKey(label?: string | null): string | null {
  if (!label) return null;
  const sizes = [...label.matchAll(/(\d+(?:\.\d+)?)\s*(tb|gb|ml|kg|l|g)\b/gi)].map((m) => {
    const [unit, factor] = SIZE_UNITS[m[2].toLowerCase()];
    return { unit, value: Number(m[1]) * factor };
  });
  if (!sizes.length) return null;
  const biggest = sizes.reduce((a, b) => (b.value > a.value ? b : a));
  return `${biggest.value}${biggest.unit}`;
}
