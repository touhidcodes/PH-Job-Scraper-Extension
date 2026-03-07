import { detectPlatform } from "./detectPlatform";
import { autoScroll } from "./utils/scroll";

import { scrapeBDJobsRealtime } from "./scrapers/bdjobs";
import { scrapeGenericRealtime } from "./scrapers/generic";
import { scrapeGlassdoorRealtime } from "./scrapers/glassdoor";
import { scrapeIndeedRealtime } from "./scrapers/indeed";
import { scrapeLinkedInRealtime } from "./scrapers/linkedin";
import { scrapeWellfoundRealtime } from "./scrapers/wellfound";
import { clearHighlight } from "./utils/highlight";

// We don't use a guard here because we want to allow re-injection 
// to replace stale listeners in the same DOM context if the extension reloads.
const registerScraper = () => {
  console.log("Nexen Scraper: Initializing message listeners...");
  
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) return;
    
    if (msg.type !== "SCRAPE_JOBS") return false;

    console.log("Nexen Scraper: Received SCRAPE_JOBS command");

    // Run async logic in IIFE so we can return true synchronously
    (async () => {
      try {
        const platform = detectPlatform();
        let jobs = [];

        // Increased initial scroll to trigger more lazy-loaded portals
        console.log("Nexen Scraper: Triggering deep lazy load (v1.6)...");
        await autoScroll(800, 400, 4); // 4 steps of 800px each

        console.log(`Nexen Scraper: Starting realtime scrape for ${platform}...`);
        
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

        console.log(`Nexen Scraper: Completed scraping ${jobs.length} jobs`);

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
        console.error("Nexen Scraper: Error:", error);
        if (chrome.runtime?.id) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Internal system error",
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
