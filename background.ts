let collectedJobs: any[] = [];

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCRAPED_JOBS") {
    collectedJobs = [...collectedJobs, ...msg.payload];
    chrome.storage.local.set({ jobs: collectedJobs });
  }
});
