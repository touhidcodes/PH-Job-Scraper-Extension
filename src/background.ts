import type { JobListing } from "./types";

let storedJobs: JobListing[] = [];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "STORE_JOBS": {
      storedJobs = message.data as JobListing[];
      sendResponse({ success: true });
      break;
    }
    case "GET_JOBS": {
      sendResponse({ success: true, data: storedJobs });
      break;
    }
    case "CLEAR_JOBS": {
      storedJobs = [];
      sendResponse({ success: true });
      break;
    }
    case "OPEN_RESULTS": {
      const url = chrome.runtime.getURL("results.html");
      chrome.tabs.create({ url });
      sendResponse({ success: true });
      break;
    }
  }
  return true;
});
