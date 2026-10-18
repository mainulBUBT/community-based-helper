import { readFile, writeFile } from "node:fs/promises";

const BBOX = "23.66,90.33,23.90,90.51";
const ENDPOINT = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "pothghat-import (+https://github.com/mainulBUBT/community-based-helper)";
const AREA_RADIUS_KM = 2.5;
const BATCH = 500;

const QUERY = `[out:json][timeout:240];
(
  nwr["amenity"~"^(pharmacy|hospital|fuel|atm|fire_station|police|veterinary|restaurant|marketplace|toilets)$"](${BBOX});
  nwr["healthcare"~"^(laboratory|blood_donation)$"](${BBOX});
  nwr["emergency"="ambulance_station"](${BBOX});
  nwr["shop"~"^(car_repair|motorcycle_repair|wholesale)$"](${BBOX});
  nwr["name"~"[Dd]iagnostic|ডায়াগনস্টিক|[Aa]mbulance|অ্যাম্বুলেন্স|[Bb]lood [Bb]ank|ব্লাড ব্যাংক"](${BBOX});
  node["place"~"^(suburb|neighbourhood|quarter)$"]["name"](${BBOX});
);
out center tags;`;

const isFacility = (t) => Boolean(t.amenity || t.healthcare || t.emergency || t.shop || t.office);
const nameHas = (t, pattern) => pattern.test(`${t.name ?? ""} ${t["name:bn"] ?? ""}`);
const WHOLESALE_NAME = /পাইকারি|আড়ত|wholesale|arot|arat/i;

const CATEGORY_RULES = [
  ["blood", (t) => t.healthcare === "blood_donation" || (isFacility(t) && nameHas(t, /blood bank|ব্লাড ব্যাংক/i))],
  ["amb", (t) => t.emergency === "ambulance_station" || (isFacility(t) && nameHas(t, /ambulance|অ্যাম্বুলেন্স/i))],
  ["diag", (t) => t.healthcare === "laboratory" || (isFacility(t) && nameHas(t, /diagnostic|ডায়াগনস্টিক/i))],
  ["hosp", (t) => t.amenity === "hospital"],
  ["pharma", (t) => t.amenity === "pharmacy"],
  ["fuel", (t) => t.amenity === "fuel"],
  ["atm", (t) => t.amenity === "atm"],
  ["fire", (t) => t.amenity === "fire_station"],
  ["thana", (t) => t.amenity === "police"],
  ["vet", (t) => t.amenity === "veterinary"],
  ["food", (t) => t.amenity === "restaurant"],
  ["mech", (t) => t.shop === "car_repair" || t.shop === "motorcycle_repair"],
  ["wholesale", (t) => t.shop === "wholesale" || (t.amenity === "marketplace" && nameHas(t, WHOLESALE_NAME))],
  ["cheap", (t) => t.amenity === "marketplace"],
  ["toilet", (t) => t.amenity === "toilets"],
];

const UNNAMED = {
  atm: (t) => [t.brand ?? t.operator, "এটিএম"].filter(Boolean).join(" "),
  fuel: (t) => [t.brand ?? t.operator, "ফিলিং স্টেশন"].filter(Boolean).join(" "),
  toilet: () => "পাবলিক টয়লেট",
  thana: () => "পুলিশ ফাঁড়ি",
  fire: () => "ফায়ার স্টেশন",
};

const CUISINE = {
  regional: "দেশি", bangladeshi: "বাংলা", bengali: "বাংলা", indian: "ভারতীয়", chinese: "চাইনিজ", thai: "থাই",
  italian: "ইতালিয়ান", japanese: "জাপানি", korean: "কোরিয়ান", arab: "আরবি", turkish: "তুর্কি", pizza: "পিৎজা",
  burger: "বার্গার", kebab: "কাবাব", biryani: "বিরিয়ানি", chicken: "চিকেন", seafood: "সি-ফুড", sushi: "সুশি",
  barbecue: "বারবিকিউ", sandwich: "স্যান্ডউইচ", coffee_shop: "কফি", ice_cream: "আইসক্রিম", dessert: "মিষ্টি",
  vegetarian: "নিরামিষ", international: "নানা দেশের", fast_food: "ফাস্ট ফুড", steak_house: "স্টেক",
};

const DAYS = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

function categoryOf(tags) {
  return CATEGORY_RULES.find(([, matches]) => matches(tags))?.[0] ?? null;
}

function nameOf(tags, category) {
  const name = (tags["name:bn"] ?? tags.name ?? "").trim();
  if (name.length >= 2) return name.slice(0, 120);
  return UNNAMED[category]?.(tags) ?? null;
}

function descriptionOf(tags, category) {
  const parts = [];
  if (category === "food") {
    const cuisines = [...new Set((tags.cuisine ?? "").split(";").map((c) => CUISINE[c.trim()]).filter(Boolean))];
    if (cuisines.length) parts.push(`খাবার: ${cuisines.slice(0, 3).join(", ")}`);
  }
  if (tags["operator:type"] === "government" || tags["operator:type"] === "public") parts.push("সরকারি");
  if (tags.emergency === "yes" && category === "hosp") parts.push("জরুরি বিভাগ আছে");
  if (tags["fuel:cng"] === "yes") parts.push("CNG পাওয়া যায়");
  if (tags.fee === "no") parts.push("বিনামূল্যে");
  if (tags.wheelchair === "yes") parts.push("হুইলচেয়ারে যাওয়া যায়");
  if (!parts.length && tags.description) parts.push(tags.description.trim());
  return parts.length ? parts.join(" · ").slice(0, 160) : null;
}

function phoneOf(tags) {
  const raw = tags["contact:phone"] ?? tags.phone ?? tags["contact:mobile"];
  const first = raw?.split(/[;,/]/)[0].replace(/[^0-9+ -]/g, "").trim();
  return first && first.length >= 3 && first.length <= 20 ? first : null;
}

function expandDays(spec) {
  return spec.split(",").flatMap((part) => {
    const [from, to] = part.split("-");
    if (!to) return [DAYS[from]];
    const start = DAY_ORDER.indexOf(from);
    const end = DAY_ORDER.indexOf(to);
    const length = ((end - start + 7) % 7) + 1;
    return Array.from({ length }, (_, i) => DAYS[DAY_ORDER[(start + i) % 7]]);
  });
}

function parseHours(raw) {
  if (!raw) return null;
  const value = raw.trim();
  if (value === "24/7") return { open24h: true, slots: [] };

  const byDay = new Map();
  for (const rule of value.split(";").map((r) => r.trim()).filter(Boolean)) {
    if (/^PH\b/.test(rule)) continue;
    const match = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(.*)$/);
    const days = match[1] ? expandDays(match[1]) : EVERY_DAY;
    const times = match[2].trim();
    if (/^(off|closed)$/i.test(times)) {
      days.forEach((d) => byDay.set(d, []));
      continue;
    }
    const ranges = times.split(",").map((r) => r.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\+?$/));
    if (!times || ranges.some((r) => !r)) return null;
    const slots = ranges.map(([, h1, m1, h2, m2]) => {
      const opens = Number(h1) * 60 + Number(m1);
      const closes = Number(h2) * 60 + Number(m2) || 1440;
      return { opens, closes };
    });
    if (slots.some((s) => s.opens >= 1440 || s.closes > 1440 || s.opens === s.closes)) return null;
    days.forEach((d) => byDay.set(d, slots));
  }

  const slots = [...byDay].flatMap(([weekday, list]) => list.map((s) => ({ weekday, ...s })));
  if (!slots.length) return null;
  const allDay = EVERY_DAY.every((d) => byDay.get(d)?.some((s) => s.opens === 0 && s.closes === 1440));
  return allDay ? { open24h: true, slots: [] } : { open24h: false, slots };
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function nearestArea(point, areas) {
  let best = null;
  for (const area of areas) {
    const km = distanceKm(point, area);
    if (km <= AREA_RADIUS_KM && (!best || km < best.km)) best = { name: area.name, km };
  }
  return best?.name ?? null;
}

async function fetchOverpass() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: `data=${encodeURIComponent(QUERY)}`,
    });
    if (response.ok) return (await response.json()).elements;
    console.warn(`Overpass ${response.status} — ৩০ সেকেন্ড পরে আবার চেষ্টা (${attempt}/3)`);
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
  throw new Error("Overpass থেকে ডেটা আনা গেল না");
}

const text = (value) => (value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const uuidOf = (ref) => `md5(${text(`osm:${ref}`)})::uuid`;

function chunks(rows) {
  return Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, i) => rows.slice(i * BATCH, (i + 1) * BATCH));
}

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const categories = await readJson("../src/data/categories.json");
const purposes = await readJson("../src/data/purposes.json");

const elements = await fetchOverpass();
const point = (e) => ({ lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon });

const areas = elements
  .filter((e) => e.tags?.place)
  .map((e) => ({ ...point(e), name: (e.tags["name:bn"] ?? e.tags.name).trim() }));

const places = [];
const seen = new Set();
for (const element of elements) {
  const tags = element.tags ?? {};
  if (tags.place) continue;
  const ref = `${element.type}/${element.id}`;
  const category = categoryOf(tags);
  const name = category && nameOf(tags, category);
  const { lat, lng } = point(element);
  if (!name || lat == null || seen.has(ref)) continue;
  seen.add(ref);
  places.push({
    ref,
    category,
    kind: tags.amenity === "marketplace" || tags.shop === "wholesale" ? "market" : "place",
    name,
    description: descriptionOf(tags, category),
    area: nearestArea({ lat, lng }, areas),
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    phone: phoneOf(tags),
    hours: parseHours(tags.opening_hours),
    vegetables: tags.amenity === "marketplace" && nameHas(tags, /কাঁচা|kacha|kancha/i),
  });
}

const placeRows = places.map(
  (p) =>
    `(${uuidOf(p.ref)}, 'osm', ${text(p.ref)}, ${text(p.kind)}, ${text(p.category)}, ${text(p.name)}, ` +
    `${text(p.description)}, ${text(p.area)}, ${p.lat}, ${p.lng}, ${text(p.phone)}, ${Boolean(p.hours?.open24h)}, 'new')`,
);
const hourRows = places.flatMap((p) =>
  (p.hours?.slots ?? []).map((s) => `(${uuidOf(p.ref)}, ${s.weekday}, ${s.opens}, ${s.closes})`),
);
const purposeRows = places.filter((p) => p.vegetables).map((p) => `(${uuidOf(p.ref)}, 'vegetables')`);

const sql = [
  `-- Generated by scripts/import-osm.mjs on ${new Date().toISOString().slice(0, 10)}.`,
  "-- Data © OpenStreetMap contributors, ODbL 1.0 — https://www.openstreetmap.org/copyright",
  "-- Re-run: npm run data:osm, then apply with: npx supabase db query --linked -f supabase/seed.sql",
  "",
  `insert into public.categories (id, name_bn, short_bn, is_market, sort_order) values\n${categories
    .map((c, i) => `(${text(c.id)}, ${text(c.name)}, ${text(c.short)}, ${c.isMarket}, ${i + 1})`)
    .join(",\n")}\non conflict (id) do update set name_bn = excluded.name_bn, short_bn = excluded.short_bn, is_market = excluded.is_market, sort_order = excluded.sort_order;`,
  "",
  `insert into public.purposes (id, name_bn, sort_order) values\n${purposes
    .map((p, i) => `(${text(p.id)}, ${text(p.name)}, ${i + 1})`)
    .join(",\n")}\non conflict (id) do update set name_bn = excluded.name_bn, sort_order = excluded.sort_order;`,
  "",
  ...chunks(placeRows).map(
    (rows) =>
      `insert into public.places (id, source, source_ref, kind, category_id, name, description, area, lat, lng, phone, open_24h, status) values\n${rows.join(",\n")}\n` +
      "on conflict (id) do update set kind = excluded.kind, category_id = excluded.category_id, name = excluded.name, " +
      "description = excluded.description, area = excluded.area, lat = excluded.lat, lng = excluded.lng, " +
      "phone = excluded.phone, open_24h = excluded.open_24h\nwhere public.places.status = 'new';",
  ),
  "",
  "delete from public.opening_hours h using public.places p where h.place_id = p.id and p.source = 'osm' and p.status = 'new';",
  ...chunks(hourRows).map(
    (rows) =>
      `insert into public.opening_hours (place_id, weekday, opens_min, closes_min) values\n${rows.join(",\n")}\non conflict do nothing;`,
  ),
  "",
  ...chunks(purposeRows).map(
    (rows) => `insert into public.place_purposes (place_id, purpose_id) values\n${rows.join(",\n")}\non conflict do nothing;`,
  ),
  "",
].join("\n");

await writeFile(new URL("../supabase/seed.sql", import.meta.url), sql);

const byCategory = Object.fromEntries(categories.map((c) => [c.id, places.filter((p) => p.category === c.id).length]));
const withHours = places.filter((p) => p.hours).length;
console.log(`supabase/seed.sql: ${places.length} places, ${hourRows.length} hour rows, ${areas.length} areas`);
console.log(`known hours: ${withHours} · with area: ${places.filter((p) => p.area).length} · with phone: ${places.filter((p) => p.phone).length}`);
console.log(byCategory);
