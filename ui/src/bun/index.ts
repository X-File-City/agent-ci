import { BrowserWindow, Utils, Tray, defineElectrobunRPC } from "electrobun/bun";
import path from "node:path";
import net from "node:net";
import fsSync from "node:fs";
import type { MyRPCSchema } from "../shared/rpc.ts";

// Spawn background processes for the OA app
let procs: any[] = [];
let dtuProc: any = null;
let supervisorProc: any = null;

function getWorkspaceRoot() {
  let current = import.meta.dirname;
  while (current !== "/" && !fsSync.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
    current = path.dirname(current);
  }
  return current === "/" ? process.cwd() : current;
}

async function startBackgroundProcesses() {
  // Supervisor can be started here or later through similar buttons if needed
}

startBackgroundProcesses();

const rpc = defineElectrobunRPC<MyRPCSchema, "bun">("bun", {
  handlers: {
    requests: {
      launchDTU: async () => {
        if (dtuProc) {
          return true;
        }
        console.log("Starting DTU server...");
        try {
          dtuProc = Bun.spawn(["pnpm", "--filter", "dtu-github-actions", "dev"], {
            cwd: getWorkspaceRoot(),
            env: process.env,
            stdout: "pipe",
            stderr: "pipe",
          });
          procs.push(dtuProc);

          const readOutput = async (stream: ReadableStream | null) => {
            if (!stream) {
              return;
            }
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              const text = decoder.decode(value);
              // Use the global rpc object directly to send to attached webviews
              rpc.send.dtuLog(text);
            }
          };

          readOutput(dtuProc.stdout);
          readOutput(dtuProc.stderr);

          // Poll port 8910 until it becomes available
          const start = Date.now();
          let isOnline = false;
          while (Date.now() - start < 10000) {
            try {
              await new Promise<void>((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(250);
                socket.once("connect", () => {
                  socket.destroy();
                  resolve();
                });
                socket.once("timeout", () => {
                  socket.destroy();
                  reject(new Error("timeout"));
                });
                socket.once("error", (err) => {
                  socket.destroy();
                  reject(err);
                });
                socket.connect(8910, "127.0.0.1");
              });
              isOnline = true;
              break;
            } catch {
              await new Promise((r) => setTimeout(r, 250));
            }
          }

          if (!isOnline) {
            dtuProc.kill();
            dtuProc = null;
            return false;
          }

          return true;
        } catch (e) {
          console.error("Failed to start DTU:", e);
          return false;
        }
      },
      stopDTU: async () => {
        if (dtuProc) {
          dtuProc.kill();
          procs = procs.filter((p) => p !== dtuProc);
          dtuProc = null;
        }
        return true;
      },
      getRecentProjects: async () => {
        const fs = await import("node:fs/promises");
        const configPath = path.join(Utils.paths.userData, "recent_projects.json");
        try {
          const content = await fs.readFile(configPath, "utf-8");
          return JSON.parse(content) as string[];
        } catch {
          return [];
        }
      },
      selectProject: async () => {
        const paths = await Utils.openFileDialog({
          canChooseFiles: false,
          canChooseDirectory: true,
          allowsMultipleSelection: false,
        });
        if (paths && paths.length > 0) {
          const selectedPath = paths[0];

          // Add to recent projects
          const fs = await import("node:fs/promises");
          const configDir = Utils.paths.userData;
          const configPath = path.join(configDir, "recent_projects.json");

          let recent: string[] = [];
          try {
            await fs.mkdir(configDir, { recursive: true });
            try {
              const content = await fs.readFile(configPath, "utf-8");
              recent = JSON.parse(content);
            } catch {
              // file doesn't exist or invalid json
            }

            // Deduplicate and move to front
            recent = [selectedPath, ...recent.filter((p) => p !== selectedPath)].slice(0, 10);
            await fs.writeFile(configPath, JSON.stringify(recent, null, 2));
          } catch (e) {
            console.error("Failed to save recent projects:", e);
          }

          return selectedPath;
        }
        return null;
      },
      getWorkflows: async ({ projectPath }) => {
        const fs = await import("node:fs/promises");
        const workflowsPath = path.join(projectPath, ".github", "workflows");
        const workflows: { id: string; name: string }[] = [];

        try {
          const files = await fs.readdir(workflowsPath, { withFileTypes: true });
          for (const file of files) {
            if (file.isFile() && (file.name.endsWith(".yml") || file.name.endsWith(".yaml"))) {
              const fullPath = path.join(workflowsPath, file.name);
              const content = await fs.readFile(fullPath, "utf-8");
              const nameMatch = content.match(/^name:\s*(.+)$/m);
              const name = nameMatch ? nameMatch[1].trim() : file.name;
              workflows.push({ id: file.name, name });
            }
          }
        } catch (e) {
          console.error("Failed to read workflows", e);
        }

        return workflows;
      },
      runWorkflow: async ({ projectPath, workflowId }) => {
        if (supervisorProc) {
          supervisorProc.kill();
          supervisorProc = null;
        }

        const workflowsPath = path.join(projectPath, ".github", "workflows");
        const fullPath = path.join(workflowsPath, workflowId);

        rpc.send.dtuLog(`\n[OA] Starting workflow run: ${workflowId} in ${projectPath}\n`);

        try {
          // pnpm --filter supervisor run oa run --workflow <path>
          supervisorProc = Bun.spawn(
            ["pnpm", "--filter", "supervisor", "run", "oa", "run", "--workflow", fullPath],
            {
              cwd: getWorkspaceRoot(),
              env: process.env,
              stdout: "pipe",
              stderr: "pipe",
            },
          );
          procs.push(supervisorProc);

          const readOutput = async (stream: ReadableStream | null) => {
            if (!stream) {
              return;
            }
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              const text = decoder.decode(value);
              rpc.send.dtuLog(text);
            }
          };

          readOutput(supervisorProc.stdout);
          readOutput(supervisorProc.stderr);

          return true;
        } catch (e) {
          console.error("Failed to run workflow:", e);
          rpc.send.dtuLog(`[OA] Failed to run workflow: ${(e as Error).message}\n`);
          return false;
        }
      },
      stopWorkflow: async () => {
        if (supervisorProc) {
          rpc.send.dtuLog(`\n[OA] Stopping workflow run...\n`);
          supervisorProc.kill();
          procs = procs.filter((p) => p !== supervisorProc);
          supervisorProc = null;
          return true;
        }
        return false;
      },
    },
  },
});

// In electrobun, main.js runs in Contents/MacOS/../Resources
// Our asset config copies the image to the app/assets folder.
const trayIconPath = path.join(import.meta.dirname, "../assets/tray.png");
console.log("Resolved tray icon path: ", trayIconPath);

// import { type MenuItemConfig } from "electrobun/bun";

// // Define the menu structure
// const _trayMenu: MenuItemConfig[] = [
//   { label: "Status: Online", type: "normal", enabled: false }, // Explicit "normal" type fixes TS strict checks
//   { type: "divider" },
//   { label: "Quit", type: "normal", action: "quit-app" },
// ];

// Create a system tray notification/icon
const tray = new Tray({
  title: "OA",
  image: trayIconPath,
  template: true, // Turn off template mode to allow standard colored PNGs
});

// The setMenu must be called explicitly to map the config into the native layer
// (some versions of electrobun drop the menu arg from the Tray constructor)
// Commented out temporarily to test direct icon clicks!
// tray.setMenu(_trayMenu);

tray.on("tray-clicked", (e: any) => {
  if (e.data?.action === "quit-app") {
    procs.forEach((p) => p.kill());
    Utils.quit();
  }
});

// Create the main application window
const mainWindow = new BrowserWindow({
  title: "OA Desktop",
  url: "views://mainview/index.html",
  rpc,
  frame: {
    width: 800,
    height: 800,
    x: 200,
    y: 200,
  },
});

// Quit the app when the main window is closed
mainWindow.on("close", () => {
  procs.forEach((p) => p.kill());
  Utils.quit();
});

console.log("OA Electrobun app started!");
