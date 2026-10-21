import { closeBrowser } from "./lib/browser";
import { discover } from "./jobs/discover";
import { refreshPrices } from "./jobs/prices";
import { readPromos } from "./jobs/promos";
import { rebuild } from "./jobs/rebuild";
import { runJob, type JobId } from "./jobs/run";

const jobs: Record<JobId, () => Promise<string>> = {
  prices: refreshPrices,
  discover,
  promos: readPromos,
  rebuild,
};

async function main() {
  const id = process.argv[2] as JobId;
  if (!(id in jobs)) throw new Error(`usage: worker <${Object.keys(jobs).join("|")}>`);
  try {
    await runJob(id, jobs[id]);
  } finally {
    await closeBrowser();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
