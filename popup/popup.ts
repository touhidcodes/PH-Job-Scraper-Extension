import { Job } from "../types";
import { exportCSV, exportXLS } from "../utils/exporter";

document.getElementById("scrape")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) return;

  let script = "";

  if (tab.url?.includes("linkedin")) script = "content/linkedin.js";
  else if (tab.url?.includes("bdjobs")) script = "content/bdjobs.js";
  else if (tab.url?.includes("wellfound")) script = "content/wellfound.js";

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [script],
  });
});

document.getElementById("csv")?.addEventListener("click", () => {
  chrome.storage.local.get("jobs", (res) =>
    exportCSV((res.jobs as Job[]) || [])
  );
});

document.getElementById("xls")?.addEventListener("click", () => {
  chrome.storage.local.get("jobs", (res) =>
    exportXLS((res.jobs as Job[]) || [])
  );
});
