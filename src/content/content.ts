import { detectPlatform } from "./detectPlatform";
import { autoScroll } from "./utils/scroll";

import { scrapeBDJobsRealtime } from "./scrapers/bdjobs";
import { scrapeGenericRealtime } from "./scrapers/generic";
import { scrapeGlassdoorRealtime } from "./scrapers/glassdoor";
import { scrapeIndeedRealtime } from "./scrapers/indeed";
import { scrapeLinkedInRealtime } from "./scrapers/linkedin";
import { scrapeWellfoundRealtime } from "./scrapers/wellfound";

// Prevent double injection and handle extension reload context invalidation
if (!document.body?.dataset?.phScraperInjected) {
  if (document.body) {
    document.body.dataset.phScraperInjected = "true";
  }

  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) return;
    
    if (msg.type !== "SCRAPE_JOBS") return false;

    // Run async logic in IIFE so we can return true synchronously
    (async () => {
      try {
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

        // Check context again before sending response
        if (chrome.runtime?.id) {
          sendResponse({
            success: true,
            platform,
            jobs,
            totalFound: jobs.length,
            scrapedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Scraping error:", error);
        if (chrome.runtime?.id) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    })();

    // Required to keep the message channel open for the async response
    return true;
  });
}
