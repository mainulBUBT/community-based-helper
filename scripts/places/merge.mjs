import { distanceKm } from "./geo.mjs";

const SAME_NAME_KM = 0.15;
const SAME_SPOT_KM = 0.05;
const SAME_NAME = 0.5;
const DIFFERENT_NAME = 0.2;
const CELL_DEG = 0.002;
const SCRIPTS = [/\p{Script=Latin}/u, /\p{Script=Bengali}/u];
const GENERIC = new Set([
  "the", "and", "of", "ltd", "limited", "pvt", "bd", "dhaka", "bangladesh", "restaurant", "restaurent", "resturant",
  "hotel", "cafe", "party", "center", "centre", "hospital", "general", "clinic", "medical", "college", "pharmacy",
  "pharma", "diagnostic", "filling", "station", "service", "cng", "হাসপাতাল", "ফার্মেসি", "ফার্মেসী", "রেস্টুরেন্ট",
  "রেস্তোরাঁ", "হোটেল", "সেন্টার",
]);

function trigrams(name) {
  const grams = new Set();
  const words = name.normalize("NFKC").toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u);
  for (const word of words.filter((w) => w && !GENERIC.has(w))) {
    const padded = `  ${word} `;
    for (let i = 0; i < padded.length - 2; i++) grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

function similarity(a, b) {
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared++;
  return shared / (a.size + b.size - shared || 1);
}

function signatureOf(place) {
  return {
    place,
    grams: place.aliases.map(trigrams),
    scripts: SCRIPTS.filter((script) => place.aliases.some((alias) => script.test(alias))),
  };
}

function compare(a, b) {
  return {
    km: distanceKm(a.place, b.place),
    score: Math.max(0, ...a.grams.flatMap((x) => b.grams.map((y) => similarity(x, y)))),
    comparable: a.scripts.some((script) => b.scripts.includes(script)),
  };
}

const cellOf = (p) => [Math.floor(p.lat / CELL_DEG), Math.floor(p.lng / CELL_DEG)];

function createIndex() {
  const cells = new Map();
  return {
    add(signature) {
      const key = cellOf(signature.place).join(":");
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(signature);
    },
    near(place) {
      const [row, col] = cellOf(place);
      return [-1, 0, 1].flatMap((dr) => [-1, 0, 1].flatMap((dc) => cells.get(`${row + dr}:${col + dc}`) ?? []));
    },
  };
}

function findMatch(index, signature) {
  let byName = null;
  let bySpot = null;
  for (const other of index.near(signature.place)) {
    const { km, score, comparable } = compare(signature, other);
    if (km <= SAME_NAME_KM && score >= SAME_NAME && (!byName || score > byName.score)) byName = { other, score };
    const sameSpot =
      km <= SAME_SPOT_KM &&
      other.place.category === signature.place.category &&
      (score >= DIFFERENT_NAME || !comparable);
    if (sameSpot && (!bySpot || km < bySpot.km)) bySpot = { other, km };
  }
  if (byName) return { target: byName.other.place, sameName: true };
  return bySpot && { target: bySpot.other.place, sameName: false };
}

export function mergePlaces(base, extra) {
  const index = createIndex();
  base.map(signatureOf).forEach(index.add);
  const added = [];
  const filled = [];
  const skipped = [];
  for (const place of [...extra].sort((a, b) => b.confidence - a.confidence || a.ref.localeCompare(b.ref))) {
    const signature = signatureOf(place);
    const match = findMatch(index, signature);
    if (!match) {
      index.add(signature);
      added.push(place);
    } else if (!match.sameName) {
      skipped.push({ place, target: match.target });
    } else {
      const { target } = match;
      const gained = { phone: !target.phone && place.phone, website: !target.website && place.website };
      if (gained.phone) target.phone = place.phone;
      if (gained.website) target.website = place.website;
      filled.push({ place, target, gained });
    }
  }
  return { places: [...base, ...added], added, filled, skipped };
}
