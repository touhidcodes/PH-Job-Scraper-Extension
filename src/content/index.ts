import { detectPlatform } from "./detectPlatform";
import { autoScroll } from "./utils/scroll";

import { scrapeBDJobsRealtime } from "./scrapers/bdjobs";
import { scrapeGenericRealtime } from "./scrapers/generic";
import { scrapeGlassdoorRealtime } from "./scrapers/glassdoor";
import { scrapeIndeedRealtime } from "./scrapers/indeed";
import { scrapeLinkedInRealtime } from "./scrapers/linkedin";
import { scrapeWellfoundRealtime } from "./scrapers/wellfound";

chrome.runtime.onMessage.addListener(async (msg, _, sendResponse) => {
  if (msg.type !== "SCRAPE_JOBS") return;

  const platform = detectPlatform();
  let jobs = [];

  // Scroll first
  await autoScroll();

  switch (platform) {
    case "linkedin":
      jobs = await scrapeLinkedInRealtime();
      break;
    case "wellfound":
      jobs = await scrapeWellfoundRealtime();
      break;
    case "bdjobs":
      jobs = await scrapeBDJobsRealtime();
      break;
    case "indeed":
      jobs = await scrapeIndeedRealtime();
      break;
    case "glassdoor":
      jobs = await scrapeGlassdoorRealtime();
      break;
    default:
      jobs = await scrapeGenericRealtime();
  }

  sendResponse({
    success: true,
    platform,
    jobs,
    totalFound: jobs.length,
    scrapedAt: new Date().toISOString(),
  });

  return true;
});
