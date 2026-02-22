import ElectrobunView from "electrobun/view";
import type { MyRPCSchema } from "../shared/rpc.ts";

const rpc = ElectrobunView.Electroview.defineRPC<MyRPCSchema>({
  maxRequestTime: 15000,
  handlers: { requests: {}, messages: {} },
});

new ElectrobunView.Electroview({ rpc });

let projectPath = "";

async function goToWorkflows(commitId: string) {
  await rpc.request.setAppState({ commitId });
  window.location.href = "views://workflows/index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const state = await rpc.request.getAppState();
  projectPath = state.projectPath;

  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => window.history.back());
  }

  const projName = document.getElementById("project-name-display");
  if (projName && projectPath) {
    projName.innerText = projectPath;
  }

  const list = document.getElementById("commits-list");
  if (list && projectPath) {
    const commits = await rpc.request.getRunCommits({ projectPath });
    if (commits.length > 0) {
      commits.forEach((commit, idx) => {
        const item = document.createElement("div");
        item.className = "list-item animate-fade-in";
        item.style.animationDelay = `${idx * 0.05}s`;

        const textWrapper = document.createElement("div");

        const title = document.createElement("div");
        title.className = "list-item-title";
        title.innerText = commit.label;

        const sub = document.createElement("div");
        sub.className = "list-item-subtitle";
        sub.innerText = new Date(commit.date).toLocaleString();

        textWrapper.appendChild(title);
        textWrapper.appendChild(sub);
        item.appendChild(textWrapper);

        item.addEventListener("click", () => goToWorkflows(commit.id));
        list.appendChild(item);
      });
    } else {
      list.innerHTML = `
        <div style="color: var(--text-secondary); text-align: center; padding: 32px">
          <div>No runs detected.</div>
          <button id="start-new-workflow-btn" class="btn btn-primary" style="margin-top: 16px;">Start a Workflow</button>
        </div>
      `;
      const startBtn = document.getElementById("start-new-workflow-btn");
      if (startBtn) {
        startBtn.addEventListener("click", () => goToWorkflows("WORKING_TREE"));
      }
    }
  }

  const dtuStatusEl = document.getElementById("dtu-status");
  const pollDtuStatus = async () => {
    if (!dtuStatusEl) {
      return;
    }
    const isUp = await rpc.request.getDtuStatus();
    if (isUp) {
      dtuStatusEl.innerText = "DTU: Running";
      dtuStatusEl.className = "status-badge status-Passed";
    } else {
      dtuStatusEl.innerText = "DTU: Stopped (Click to Start)";
      dtuStatusEl.className = "status-badge status-Failed";
    }
  };

  if (dtuStatusEl) {
    dtuStatusEl.addEventListener("click", async () => {
      const isUp = await rpc.request.getDtuStatus();
      if (!isUp) {
        dtuStatusEl.innerText = "DTU: Starting...";
        dtuStatusEl.className = "status-badge status-Running";
        await rpc.request.launchDTU();
        await pollDtuStatus();
      } else {
        dtuStatusEl.innerText = "DTU: Stopping...";
        dtuStatusEl.className = "status-badge status-Running";
        await rpc.request.stopDTU();
        await pollDtuStatus();
      }
    });
    pollDtuStatus();
    setInterval(pollDtuStatus, 3000);
  }
});

// Global escape listener
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.history.back();
  }
});
