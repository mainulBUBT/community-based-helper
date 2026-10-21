import type { SpecGroup } from "@/types/catalog";

const SEPARATOR = " | ";

export function specsToText(specs: SpecGroup[]) {
  return specs.map((g) => [g.group, ...g.items.map((i) => `${i.label}${SEPARATOR}${i.value}`)].join("\n")).join("\n\n");
}

export function textToSpecs(text: string): SpecGroup[] {
  const groups: SpecGroup[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const at = line.indexOf("|");
    if (at < 0) {
      groups.push({ group: line, items: [] });
      continue;
    }
    const label = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (!label || !value) continue;
    if (!groups.length) groups.push({ group: "General", items: [] });
    groups.at(-1)!.items.push({ label, value });
  }
  return groups.filter((g) => g.items.length);
}

export const KEY_SPECS = ["display", "chip", "graphics", "rearCamera", "frontCamera", "battery", "charging", "os", "network", "water", "weight"] as const;
export type KeySpec = (typeof KEY_SPECS)[number];

const RULES: Record<KeySpec, { group: RegExp; labels: RegExp[] }> = {
  display: { group: /display|general/i, labels: [/^(display\s*)?size$|^display$/i, /^(display\s*)?type$/i, /refresh rate/i] },
  chip: { group: /processor|chipset|general/i, labels: [/^chipset( model)?$|^processor( model)?$/i] },
  graphics: { group: /graphics/i, labels: [/graphics model/i] },
  rearCamera: { group: /rear camera/i, labels: [/^resolution$/i] },
  frontCamera: { group: /front camera|camera & audio/i, labels: [/^resolution$|webcam/i] },
  battery: { group: /battery|power|general/i, labels: [/^type$|battery capacity|^battery$/i] },
  charging: { group: /battery|power/i, labels: [/fast charging|adapter type/i] },
  os: { group: /os|software|general/i, labels: [/operating system|^os$/i] },
  network: { group: /network/i, labels: [/^network$/i] },
  water: { group: /features/i, labels: [/ip rating/i] },
  weight: { group: /physical/i, labels: [/^weight$/i] },
};

const MAX_PART = 24;
const shorten = (value: string) => (value.length > MAX_PART ? value.split(/[,(]/)[0].trim() : value);

function find(specs: SpecGroup[], group: RegExp, label: RegExp) {
  for (const g of specs) {
    if (!group.test(g.group)) continue;
    const item = g.items.find((i) => label.test(i.label));
    if (item) return item.value;
  }
  return null;
}

export function keySpecs(specs: SpecGroup[]) {
  return KEY_SPECS.flatMap((key) => {
    const { group, labels } = RULES[key];
    const parts = labels.map((label) => find(specs, group, label)).filter((v): v is string => Boolean(v));
    return parts.length ? [{ key, value: [...new Set(parts.map(shorten))].join(", ") }] : [];
  });
}

const HIGHLIGHT_KEYS: KeySpec[] = ["display", "chip", "rearCamera", "battery"];

export const specHighlights = (specs: SpecGroup[]) => keySpecs(specs).filter((s) => HIGHLIGHT_KEYS.includes(s.key));
