import { sampleProducts, sampleOffers } from "@/data/sample";

const offersByVariant = new Map<string, typeof sampleOffers>();
for (const offer of sampleOffers) {
  const list = offersByVariant.get(offer.variantId);
  if (list) list.push(offer);
  else offersByVariant.set(offer.variantId, [offer]);
}

const air15 = sampleProducts.find((p) => p.name.includes("MacBook Air 15"));
const pro14 = sampleProducts.find((p) => p.name.includes("MacBook Pro 14\" M5") && !p.name.includes("Pro"));
console.log("air15:", air15?.name, "pro14:", pro14?.name);

for (const p of [air15, pro14]) {
  for (const v of p!.variants) {
    const offers = offersByVariant.get(v.id) ?? [];
    const prices = offers.map((o) => o.price).sort((a, b) => a - b);
    console.log(`${p!.name} | ${v.label} | ${JSON.stringify(v.attributes)} | prices ${prices.join(", ")}`);
  }
}
