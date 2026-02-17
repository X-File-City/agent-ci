
import { config } from "./src/config";
import path from "path";

const dockerApiUrl = config.GITHUB_API_URL.replace("localhost", "host.docker.internal").replace("127.0.0.1", "host.docker.internal");
const repoUrl = `${dockerApiUrl}/${config.GITHUB_REPO}`;

console.log("GITHUB_API_URL:", config.GITHUB_API_URL);
console.log("GITHUB_REPO:", config.GITHUB_REPO);
console.log("dockerApiUrl:", dockerApiUrl);
console.log("repoUrl:", repoUrl);
