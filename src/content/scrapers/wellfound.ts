import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeWellfoundRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();
  
  let noNewJobsCount = 0;
  const MAX_NO_NEW_JOBS = 5; // A bit more patient for deep loads
  const MAX_JOBS = 100; // Target 100 jobs as requested
  const SCROLL_STEP = 800;

  console.log("Nexen Scraper: Starting Wellfound deep scan (Target: 100)...");

  while (jobs.length < MAX_JOBS && noNewJobsCount < MAX_NO_NEW_JOBS) {
    // Re-calculate scroll percentage
    const scrollPct = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;

    // Get current cards
    const cards = Array.from(
      document.querySelectorAll(
        '[data-test="StartupResult"], [class*="JobListingCard"], [class*="styles_result__"], .job-listing, [class*="StartupResult_"], li[class*="ListItem"], [data-test*="JobListing"]'
      )
    );

    let foundNewInThisPass = false;

    for (const card of cards) {
      if (jobs.length >= MAX_JOBS) break;

      // Extraction Logic
      const titleEl = card.querySelector('h3, h2, [class*="Header"], [class*="title"], [class*="role"], [class*="styles_title__"], a[href*="/jobs/"]');
      const companyEl = card.querySelector('[class*="styles_nameContent__"] a, [class*="company"], [class*="startup"], [class*="styles_name__"], h4, a[href*="/startup/"]');
      
      let title = extractText(titleEl);
      let company = extractText(companyEl);

      if (!title) {
        const topLink = card.querySelector('a');
        if (topLink && topLink.innerText.length > 3) title = topLink.innerText.trim();
      }
      
      if (!title || !company) {
        const fallbackCompany = extractText(card.querySelector('[class*="styles_startupName__"]')) || 
                               extractText(card.querySelector('a[href*="/startup/"]')) ||
                               extractText(card.querySelector('a[href*="/l/"]'));
        if (!title || (!company && !fallbackCompany)) continue;
        if (!company) company = fallbackCompany;
      }
      
      const cleanedCompany = company || "Unknown Tech";
      const fingerprint = `${title}-${cleanedCompany}`.toLowerCase();
      
      if (seenIds.has(fingerprint)) continue;

      seenIds.add(fingerprint);
      foundNewInThisPass = true;
      noNewJobsCount = 0; 

      highlight(card);

      // Deep extraction
      const salaryEl = card.querySelector('[class*="salary"], [class*="compensation"], [class*="styles_compensation__"]');
      const locationEl = card.querySelector('[class*="location"], [class*="styles_location__"], [class*="styles_details__"] span:first-child');
      const jobTypeEl = card.querySelector('[class*="jobType"], [class*="styles_type__"], [class*="styles_jobType__"]');

      jobs.push({
        id: `wf-${Date.now()}-${jobs.length}`,
        title,
        company: cleanedCompany,
        role: title,
        location: extractText(locationEl) || "Remote / Hybrid",
        deadline: "Open",
        salary: extractText(salaryEl) || "See Job Info",
        jobType: extractText(jobTypeEl) || "Full-time",
        url: (card.querySelector("a[href*='/jobs/']") as HTMLAnchorElement)?.href || 
             (card.querySelector("a[href*='/l/']") as HTMLAnchorElement)?.href ||
             (card.querySelector("a") as HTMLAnchorElement)?.href || 
             location.href,
        platform: "Wellfound",
        scrapedAt: new Date().toISOString(),
      });

      emitScrapeProgress({ 
        current: jobs.length, 
        total: MAX_JOBS, 
        title: `${cleanedCompany}: ${title}`,
        scrollPercent: scrollPct
      });

      // Rapid pass
      await new Promise((res) => setTimeout(res, 50));
    }

    if (!foundNewInThisPass) {
      noNewJobsCount++;
      console.log(`Nexen Scraper: Scrolling for more... (${noNewJobsCount}/${MAX_NO_NEW_JOBS})`);
      window.scrollBy(0, SCROLL_STEP);
      
      // Update progress even while scrolling
      emitScrapeProgress({
        current: jobs.length,
        total: MAX_JOBS,
        title: "Scanning for fresh listings...",
        scrollPercent: (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
      });

      await new Promise((res) => setTimeout(res, 2200)); // Wait for lazy load
    } else {
      // Gentle scroll to keep moving
      window.scrollBy(0, SCROLL_STEP / 2);
      await new Promise((res) => setTimeout(res, 400));
    }

    // Safety check - if no more space to scroll, stop
    if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight && !foundNewInThisPass) {
       console.log("Nexen Scraper: Reached end of page.");
       break;
    }
  }

  clearHighlight();
  return jobs;
}
