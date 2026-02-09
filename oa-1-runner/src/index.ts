import { config } from "./config";
import { pollJobs } from "./bridge";
import { executeJob } from "./executor";

async function main() {
  console.log(`[Runner] Starting runner for user: ${config.GITHUB_USERNAME}`);
  console.log(`[Runner] Bridge URL: ${config.BRIDGE_URL}`);

  // Polling loop
  setInterval(async () => {
    console.log("[Runner] Polling for jobs...");
    const jobs = await pollJobs();

    if (jobs.length > 0) {
      console.log(`[Runner] Found ${jobs.length} jobs.`);
      for (const job of jobs) {
        await executeJob(job);
      }
    }
  }, 10_000);
}

main().catch((err) => {
  console.error("[Runner] Fatal error:", err);
  process.exit(1);
});
