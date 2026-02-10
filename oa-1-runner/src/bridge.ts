import { config } from "./config";
import { Job } from "./types";

export async function pollJobs(): Promise<Job[]> {
  const url = `${config.BRIDGE_URL}/api/jobs?username=${config.GITHUB_USERNAME}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Bridge] Failed to poll jobs: ${response.status} ${response.statusText}`);
      return [];
    }

    const jobs = await response.json() as Job[];
    return jobs;
  } catch (error) {
    console.error("[Bridge] Error polling jobs:", error);
    return [];
  }
}
