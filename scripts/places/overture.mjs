import { DuckDBInstance } from "@duckdb/node-api";
import { CUISINE } from "./cuisine.mjs";

const CATALOG = "https://stac.overturemaps.org/catalog.json";
const MIN_CONFIDENCE = 0.5;

const TAXONOMY = {
  blood_and_plasma_donation_center: "blood",
  ambulance_or_ems_service: "amb",
  laboratory_testing: "diag",
  radiology: "diag",
  hospital: "hosp",
  emergency_department: "hosp",
  pharmacy: "pharma",
  gas_station: "fuel",
  atm: "atm",
  fire_station: "fire",
  police_station: "thana",
  veterinary_care: "vet",
  restaurant: "food",
  automotive_repair: "mech",
  auto_body_shop: "mech",
  motorcycle_repair: "mech",
  wholesaler: "wholesale",
  farmers_market: "cheap",
  public_restroom: "toilet",
};

const HEALTH_BY_NAME = [
  ["blood", /blood bank|ব্লাড ব্যাংক/i],
  ["amb", /ambulance|অ্যাম্বুলেন্স/i],
  ["diag", /diagnostic|ডায়াগনস্টিক/i],
];

const HOSPITAL_NAME =
  /^(?!.*(dental|ডেন্টাল)).*(hospital|হাসপাতাল|হসপিটাল|medical college|মেডিকেল কলেজ|clinic|ক্লিনিক|institute|ইনস্টিটিউট|ইন্সটিটিউট)/i;

const BLOCKED_HOST =
  /(^|\.)(google\.[a-z.]+|goo\.gl|youtube\.com|youtu\.be|wa\.me|m\.me|tiktok\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com|wikipedia\.org|daraz\.com\.bd)$/i;

const QUERY = (release) => `
  select id, trim(coalesce(names.common['bn'], names.primary)) as name, taxonomy.primary as taxon,
    taxonomy.hierarchy as hierarchy, phones, websites, confidence, st_y(geometry) as lat, st_x(geometry) as lng,
    list_transform(sources, s -> s.dataset || ' (' || s.license || ')') as licenses
  from read_parquet('s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*', hive_partitioning = 1)
  where bbox.xmin between 90.33 and 90.51 and bbox.ymin between 23.66 and 23.90
    and confidence >= ${MIN_CONFIDENCE} and coalesce(operating_status, 'open') = 'open'
    and taxonomy.hierarchy is not null and length(trim(names.primary)) >= 2`;

function categoryOf(row) {
  if (row.hierarchy[0] === "health_care") {
    const named = HEALTH_BY_NAME.find(([, pattern]) => pattern.test(row.name));
    if (named) return named[0];
  }
  const category = TAXONOMY[row.hierarchy.findLast((taxon) => TAXONOMY[taxon])] ?? null;
  return category === "hosp" && !HOSPITAL_NAME.test(row.name) ? null : category;
}

function phoneOf(phones) {
  return phones?.map((p) => p.replace(/[^0-9+]/g, "")).find((p) => /^(\+880|0)\d{6,11}$/.test(p)) ?? null;
}

function websiteOf(websites) {
  const usable = (url) => {
    const host = url.match(/^https?:\/\/([^/?#:]+)/)?.[1];
    return host && !BLOCKED_HOST.test(host) && url.length <= 200;
  };
  return websites?.map((url) => url.replace(/^https?:/i, (scheme) => scheme.toLowerCase())).find(usable) ?? null;
}

function descriptionOf(row, category) {
  const cuisine = category === "food" && CUISINE[row.taxon.replace(/_restaurant$/, "")];
  return cuisine ? `খাবার: ${cuisine}` : null;
}

async function latestRelease() {
  const response = await fetch(CATALOG);
  if (!response.ok) throw new Error(`Overture catalog ${response.status}`);
  return (await response.json()).latest;
}

export async function fetchOverture() {
  const release = await latestRelease();
  const connection = await (await DuckDBInstance.create()).connect();
  await connection.run("install spatial; load spatial; install httpfs; load httpfs; set s3_region = 'us-west-2';");
  const rows = (await connection.runAndReadAll(QUERY(release))).getRowObjectsJS();

  const places = [];
  const licenses = new Set();
  for (const row of rows) {
    const category = categoryOf(row);
    if (!category) continue;
    row.licenses.forEach((license) => licenses.add(license));
    places.push({
      source: "overture",
      ref: row.id,
      category,
      kind: category === "cheap" || category === "wholesale" ? "market" : "place",
      name: row.name.slice(0, 120),
      aliases: [row.name],
      description: descriptionOf(row, category),
      lat: Number(row.lat.toFixed(6)),
      lng: Number(row.lng.toFixed(6)),
      phone: phoneOf(row.phones),
      website: websiteOf(row.websites),
      hours: null,
      vegetables: row.taxon === "farmers_market",
      confidence: row.confidence,
    });
  }
  return { release, places, licenses: [...licenses].sort() };
}
