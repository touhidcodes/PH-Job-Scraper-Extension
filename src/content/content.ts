import { detectPlatform } from "./detectPlatform";
import { autoScroll } from "./utils/scroll";

import { scrapeBDJobsRealtime } from "./scrapers/bdjobs";
import { scrapeGenericRealtime } from "./scrapers/generic";
import { scrapeGlassdoorRealtime } from "./scrapers/glassdoor";
import { scrapeIndeedRealtime } from "./scrapers/indeed";
import { scrapeLinkedInRealtime } from "./scrapers/linkedin";
import { scrapeWellfoundRealtime } from "./scrapers/wellfound";
import { clearHighlight } from "./utils/highlight";

// Helper to register listener
const registerScraper = () => {
  // Use a window property to avoid double-registration in the SAME script execution
  // but we allow multiple registrations across different executions (like after extension reload)
  // because the old listeners will have an invalid chrome.runtime.id.
  
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) return;
    
    if (msg.type !== "SCRAPE_JOBS") return false;

    console.log("PH Scraper: Received SCRAPE_JOBS command");

    // Run async logic in IIFE so we can return true synchronously
    (async () => {
      try {
        const platform = detectPlatform();
        let jobs = [];

        // Scroll a bit to trigger lazy loading if needed, but not necessarily the whole page
        // as we now have auto-scroll during highlighting
        await autoScroll(800, 400);

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

        // Clear highlight when done
        clearHighlight();

        console.log(`PH Scraper: Completed scraping ${jobs.length} jobs`);

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
};

// Initialize
registerScraper();
