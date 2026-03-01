import type { ChromeMessage, ScrapeResult } from "../types";

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, _sender, sendResponse) => {
    if (message.type === "OPEN_RESULTS") {
      const result = (message as { type: string; payload: ScrapeResult })
        .payload;

      // Store data and open results tab
      chrome.storage.local.set({ scrapeResult: result }, () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL("results.html"),
        });
      });

      sendResponse({ ok: true });
    }
    return true;
  }
);
