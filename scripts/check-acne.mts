import { stores, type Store } from "../workers/stores";
import type { Listing } from "../workers/stores/types";
import { message, StoreBlocked } from "../workers/lib/errors";
import { pool } from "../workers/lib/pool";

const TARGETS: { name: string; re: RegExp }[] = [
  { name: "Himalaya Purifying Neem Face Wash", re: /himalaya\s*.*\bpurifying\s*neem\b|\bneem\s+face\s+wash\b.*himalaya|pure\s*herbs.*neem/i },
  { name: "Cetaphil Oily Skin Cleanser", re: /\bcetaphil\b[\s\S]*\b(oily\s+skin|daily\s+facial)\b/i },
  { name: "Neutrogena Oil-Free Acne Wash", re: /\bneutrogena\b[\s\S]*\b(oil.?free|acne\s+wash|pink\s+grapefruit|visibly\s+clear)\b/i },
  { name: "Garnier Pure Active Neem", re: /\bgarnier\b[\s\S]*\bpure\s*active\b[\s\S]*\b(neem|tulsi|acne|pimple)\b/i },
  { name: "COSRX Low pH Good Morning Cleanser", re: /\bcosrx\b[\s\S]*\b(low.?ph|good\s+morning)\b/i },
  { name: "Sebamed Clear Face Cleansing Gel", re: /\bsebamed\b[\s\S]*\bclear\s+face\b/i },
  { name: "Clean & Clear Foaming Face Wash", re: /\bclean\s*(&|and)\s*clear\b[\s\S]*\b(foaming|acne|pimple)\b/i },
  { name: "Acnes Medicated Face Wash", re: /\bacnes\b[\s\S]*\b(wash|medicated)\b/i },
];

const BEAUTY = new Set([
  "shajgoj", "arogga", "othoba", "skincareshop", "indianmartbd", "colorworld", "glowella", "ohsogo",
  "chardike", "beprincess", "koreanmartbd", "aureva", "koreanskincarebd", "beautybooth", "bdamajan",
  "ukdirect", "skinrevive", "efamas", "emartway", "koreancare", "dazzle", "klassy", "herhappyskin", "perfectobd",
]);

const hits = new Map<string, Map<string, { count: number; sample: string }>>(TARGETS.map((t) => [t.name, new Map()]));

function scan(store: Store, listings: Listing[]) {
  for (const listing of listings) {
    for (const target of TARGETS) {
      if (!target.re.test(listing.title)) continue;
      const perStore = hits.get(target.name)!;
      const entry = perStore.get(store.name) ?? { count: 0, sample: listing.url };
      entry.count++;
      perStore.set(store.name, entry);
    }
  }
}

async function main() {
  const beauty = stores.filter((s) => BEAUTY.has(s.id));
  await pool(beauty, 4, async (store) => {
    try {
      const listings = await store.discover([]);
      scan(store, listings);
      console.log(`✓ ${store.name}: ${listings.length} listings`);
    } catch (error) {
      console.log(`✗ ${store.name}: ${error instanceof StoreBlocked ? "blocked" : message(error)}`);
    }
  });
  console.log("\n===== ফল =====");
  for (const target of TARGETS) {
    const perStore = hits.get(target.name)!;
    console.log(`\n${target.name} — ${perStore.size}টা দোকান`);
    for (const [storeName, { count, sample }] of [...perStore].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`  ${storeName} (${count}): ${sample}`);
    }
  }
}

main();
