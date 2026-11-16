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

interface Rule {
  group: RegExp;
  labels: RegExp[];
  combine?: boolean;
}

// দোকান আর প্রস্তুতকারকের পাতা একই জিনিস ভিন্ন নামে লেখে (Screen Size/Display Size, Chipset/Processor Model…)।
// নিয়ম শুধু Star Tech-এর নাম ধরে লিখলে মোবাইল আর ল্যাপটপের অর্ধেক ঘর তুলনায় ফাঁকা থেকে যায়, তাই নামগুলো 넓।
const RULES: Record<KeySpec, Rule> = {
  display: {
    group: /display|screen|main feature|general/i,
    labels: [/^(display\s*)?size$|^screen size$/i, /^(display\s*)?type$|^screen type$/i, /refresh rate/i, /^display$|^screen$/i],
    combine: true,
  },
  chip: {
    group: /processor|chipset|hardware|platform|main feature|basic information|general/i,
    labels: [/^processor( model| type)?$/i, /^chipset( model)?$/i, /^cpu( type)?$/i, /^chip$/i],
  },
  graphics: {
    group: /graphics|gpu|hardware|processor|chipset|basic information|main feature|general/i,
    labels: [/^graphics( card| model| type)?$/i, /^gpu( model)?$/i],
  },
  rearCamera: { group: /rear camera|main camera/i, labels: [/^resolution$/i, /^rear( camera)?$|^main camera$/i] },
  frontCamera: { group: /front camera|selfie camera|camera & audio/i, labels: [/^resolution$/i, /^front( camera)?$|^selfie camera$|webcam/i] },
  battery: {
    group: /battery|power|main feature|general/i,
    labels: [/^(battery\s*)?capacity$/i, /^battery$/i, /^type$|^battery type$/i],
  },
  charging: {
    group: /battery|power|charging|main feature|general/i,
    labels: [/fast charging|quick charging|^charging$/i, /^adapter( type)?$|power adapter|^output$/i],
  },
  os: { group: /os|software|operating|platform|main feature|general/i, labels: [/operating system|^os$|^os version$/i] },
  network: {
    group: /network|connectivity|key features|main feature|general/i,
    labels: [/^network/i, /^connection type$|^connectivity$/i, /^wifi$|^wi-fi$/i, /^bluetooth( version)?$|^bt version$/i],
  },
  water: {
    group: /features|design|general|special|body|physical|exterior|rugged/i,
    labels: [/^ip ?rating$|^ip\d+/i, /water ?proof|water ?resist|rugged/i],
  },
  weight: {
    group: /physical|design|body|build|dimension|main feature|general|exterior|weight/i,
    labels: [/^weight$/i],
  },
};

const MAX_PART = 24;
const shorten = (value: string) => (value.length > MAX_PART ? value.split(/[,(]/)[0].trim() : value);

const FIELD = /^([^:]{1,40}):\s*(.+)$/;

// কিছু দোকান (Lenovo PSREF) একটা ঘরের ভেতরে "Model: … | Memory: …" লিখে রাখে; ভাঙলে বাকি নিয়মগুলোই খাটে
function nested(item: { label: string; value: string }): SpecGroup | null {
  const parts = item.value.split(/\s*\|\s*/).map((part) => FIELD.exec(part.trim()));
  if (parts.length < 2 || parts.some((part) => !part)) return null;
  return { group: item.label, items: parts.map((part) => ({ label: part![1].trim(), value: part![2].trim() })) };
}

function normalize(specs: SpecGroup[]): SpecGroup[] {
  const out: SpecGroup[] = [];
  for (const group of specs) {
    let plain: SpecGroup = { group: group.group, items: [] };
    for (const item of group.items) {
      const expanded = nested(item);
      if (!expanded) {
        plain.items.push(item);
        continue;
      }
      if (plain.items.length) {
        out.push(plain);
        plain = { group: group.group, items: [] };
      }
      out.push(expanded);
    }
    if (plain.items.length) out.push(plain);
  }
  return out;
}

function values(specs: SpecGroup[], { group, labels, combine }: Rule): string[] {
  for (const g of specs) {
    if (!group.test(g.group)) continue;
    if (combine) {
      const parts = labels.flatMap((label) => {
        const item = g.items.find((i) => label.test(i.label) && i.value);
        return item ? [item.value] : [];
      });
      if (parts.length) return parts;
    } else {
      for (const label of labels) {
        const item = g.items.find((i) => label.test(i.label) && i.value);
        if (item) return [item.value];
      }
    }
  }
  return [];
}

// mobiledokan একই "Cameras" ঘরে দুবার Resolution লেখে: প্রথমটা পেছনের, দ্বিতীয়টা সামনের ক্যামেরা
function camera(specs: SpecGroup[], front: boolean): string[] {
  const direct = values(specs, {
    group: front ? /^front camera|^selfie camera/i : /^rear camera|^main camera/i,
    labels: front ? [/^resolution$/i, /^front( camera)?$|^selfie camera$/i] : [/^resolution$/i, /^rear( camera)?$|^main camera$/i],
  });
  if (direct.length) return direct;
  const generic = specs.find((g) => /^cameras?$/i.test(g.group));
  if (generic) {
    const side = front ? /^front$/i : /^rear$/i;
    const named = generic.items.find((i) => side.test(i.label) && i.value);
    if (named) return [named.value];
    const resolutions = generic.items.filter((i) => /^resolution$/i.test(i.label) && i.value);
    const pick = front ? resolutions[1] : resolutions[0];
    if (pick) return [pick.value];
  }
  if (front) return values(specs, { group: /camera & audio|^camera$|^specification$/i, labels: [/webcam|^camera$/i] });
  return [];
}

// HP/ASUS/Lenovo-র Processor ঘরে চিপের নাম শুধু "Model"; Main Features ঘরের "Model" পণ্যের নাম, তাই আলাদা
function chip(specs: SpecGroup[]): string[] {
  const named = values(specs, {
    group: /processor|chipset|hardware|platform|main feature|basic information|^chip$/i,
    labels: [/^processor( model| type)?$/i, /^chipset( model)?$/i, /^cpu( type)?$/i, /^chip$/i],
  });
  if (named.length) return named;
  const model = values(specs, { group: /processor|chipset|^chip$/i, labels: [/^model$/i] });
  if (model.length) return model;
  return values(specs, { group: /^general$/i, labels: [/^chipset( model)?$/i, /^processor( model)?$/i, /^cpu( type)?$/i] });
}

function graphics(specs: SpecGroup[]): string[] {
  const named = values(specs, {
    group: /graphics|gpu|hardware|processor|chipset|basic information|main feature|^chip$/i,
    labels: [/^graphics( card| model| type)?$/i, /^gpu( model| cores)?$/i],
  });
  if (named.length) return named;
  return values(specs, { group: /graphics|gpu|^chip$/i, labels: [/^model$/i] });
}

export function keySpecs(specs: SpecGroup[]) {
  const list = normalize(specs);
  return KEY_SPECS.flatMap((key) => {
    const parts =
      key === "rearCamera"
        ? camera(list, false)
        : key === "frontCamera"
          ? camera(list, true)
          : key === "chip"
            ? chip(list)
            : key === "graphics"
              ? graphics(list)
              : values(list, RULES[key]);
    return parts.length ? [{ key, value: [...new Set(parts.map(shorten))].join(", ") }] : [];
  });
}

const HIGHLIGHT_KEYS: KeySpec[] = ["display", "chip", "rearCamera", "battery"];

export const specHighlights = (specs: SpecGroup[]) => keySpecs(specs).filter((s) => HIGHLIGHT_KEYS.includes(s.key));
