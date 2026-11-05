import { closeBrowser } from "./lib/browser";
import { discover } from "./jobs/discover";
import { localDiscover } from "./jobs/local-discover";
import { discoverStep } from "./jobs/matrix";
import { refreshPrices } from "./jobs/prices";
import { readPromos } from "./jobs/promos";
import { rebuild } from "./jobs/rebuild";
import { runJob, type JobId, type JobRun } from "./jobs/run";
import { autoReview, compareWithHumans } from "./services/auto-review";

const jobs: Record<JobId, (run: JobRun) => Promise<string>> = {
  prices: refreshPrices,
  local_discover: (run) => {
    process.env.LOCAL_JOB = "1";
    return localDiscover(run);
  },
  local_prices: () => {
    process.env.LOCAL_JOB = "1";
    return refreshPrices();
  },
  discover,
  promos: readPromos,
  rebuild,
};

async function main() {
  const [id, step, arg] = process.argv.slice(2) as [JobId, string | undefined, string | undefined];
  // হাতে চালানো: যাচাই বাকি থেকে AI এখনই সিদ্ধান্ত নেয় (prices run এর শেষেও এটাই চলে)
  if ((id as string) === "review") {
    console.log(step === "dry" ? (await compareWithHumans()).join("\n") : await autoReview());
    return;
  }
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
