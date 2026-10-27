import { closeBrowser } from "./lib/browser";
import { discover } from "./jobs/discover";
import { discoverStep } from "./jobs/matrix";
import { refreshPrices } from "./jobs/prices";
import { readPromos } from "./jobs/promos";
import { rebuild } from "./jobs/rebuild";
import { runJob, type JobId, type JobRun } from "./jobs/run";

import { syncSpecialOffers } from "../scripts/special-stores";

const jobs: Record<JobId, (run: JobRun) => Promise<string>> = {
  prices: refreshPrices,
  discover,
  promos: readPromos,
  rebuild,
  special_sync: async () => {
    await syncSpecialOffers();
    return "Special stores sync completed";
  },
};

async function main() {
  const [id, step, arg] = process.argv.slice(2) as [JobId, string | undefined, string | undefined];
  if (!(id in jobs)) throw new Error(`usage: worker <${Object.keys(jobs).join("|")}>`);
  try {
    if (id === "discover" && step) await discoverStep(step, arg);
    else await runJob(id, jobs[id]);
  } finally {
    await closeBrowser();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
