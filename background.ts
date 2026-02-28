/* Fired when the extension is installed or updated */
chrome.runtime.onInstalled.addListener(() => {
  console.log("Job Scraper Extension installed");
});

/* Listen for messages from popup or content scripts */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ ok: true, message: "Background alive" });
    return true;
  }

  if (message.type === "INJECT_SCRAPER") {
    injectContentScript(message.script)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // async response
  }
});

/* Inject a content script dynamically */
async function injectContentScript(script: string) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) throw new Error("No active tab found");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [`dist/content/${script}.js`],
  });
}
