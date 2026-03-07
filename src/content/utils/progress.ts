interface ScrapeProgressPayload {
  current: number;
  total: number;
  title: string;
  scrollPercent?: number;
}

export const emitScrapeProgress = (payload: ScrapeProgressPayload) => {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({
    type: "SCRAPE_PROGRESS",
    payload,
  });
};
