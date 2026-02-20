import { config } from "./config.js";
import { startWarmPool, stopWarmPool } from "./warm-pool.js";

async function main() {
  console.log(`[Supervisor] Starting supervisor for user: ${config.GITHUB_USERNAME}`);
  console.log(`[Supervisor] Bridge URL: ${config.BRIDGE_URL}`);

  await startWarmPool();

  const cleanup = async () => {
    console.log("[Supervisor] Shutting down...");
    await stopWarmPool();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("[Supervisor] Fatal error:", err);
  process.exit(1);
});
