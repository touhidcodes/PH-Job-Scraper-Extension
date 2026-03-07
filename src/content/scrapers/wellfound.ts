import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeWellfoundRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();
  
  let noNewJobsCount = 0;
  const MAX_NO_NEW_JOBS = 3; // Stop if we scroll 3 times and see no new jobs
  const TIMEOUT = 1500; // Wait for lazy loading
  const MAX_JOBS = 500; // Safety limit

  console.log("Nexen Scraper: Starting Wellfound deep scan...");

  while (jobs.length < MAX_JOBS && noNewJobsCount < MAX_NO_NEW_JOBS) {
    // Re-query cards as new ones are added to the DOM
    const cards = Array.from(
      document.querySelectorAll(
        '[data-test="StartupResult"], [class*="JobListingCard"], .job-listing, [class*="styles_result__"]'
      )
    );

    let foundNewInThisPass = false;

    for (const card of cards) {
      // Use a unique fingerprint for the card since IDs are rotating
      const titleEl = card.querySelector("h2, h3, [class*='title'], [class*='role']");
      const companyEl = card.querySelector("[class*='company'], [class*='startup'], [class*='styles_name__']");
      
      const title = extractText(titleEl);
      const company = extractText(companyEl);
      
      if (!title || !company) continue;
      
      const fingerprint = `${title}-${company}`.toLowerCase();
      if (seenIds.has(fingerprint)) continue;

      seenIds.add(fingerprint);
      foundNewInThisPass = true;
      noNewJobsCount = 0; // Reset counter since we found something

      highlight(card);

      // Better extraction for Wellfound
      const salaryEl = card.querySelector("[class*='salary'], [class*='styles_compensation__']");
      const locationEl = card.querySelector("[class*='location'], [class*='styles_location__']");
      const jobTypeEl = card.querySelector("[class*='jobType'], [class*='styles_jobType__'], [class*='styles_type__']");

      jobs.push({
        id: `wellfound-${Date.now()}-${jobs.length}`,
        title,
        company,
        role: title,
        location: extractText(locationEl) || "Remote / On-site",
        deadline: "N/A",
        salary: extractText(salaryEl) || "Competitive",
        jobType: extractText(jobTypeEl) || "Full-time",
        url: (card.querySelector("a[href*='/jobs/']") as HTMLAnchorElement)?.href || 
             (card.querySelector("a") as HTMLAnchorElement)?.href || 
             location.href,
        platform: "Wellfound",
        scrapedAt: new Date().toISOString(),
      });

      emitScrapeProgress({ 
        current: jobs.length, 
        total: Math.max(jobs.length, cards.length), 
        title: `${company}: ${title}` 
      });

      await new Promise((res) => setTimeout(res, 200));
    }

    if (!foundNewInThisPass) {
      noNewJobsCount++;
      console.log(`Nexen Scraper: No new jobs found, scrolling... (${noNewJobsCount}/${MAX_NO_NEW_JOBS})`);
      
      // Scroll to the bottom to trigger more
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((res) => setTimeout(res, TIMEOUT));
    } else {
      // Small scroll to keep things moving even if we found jobs
      window.scrollBy(0, 400);
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  clearHighlight();
  return jobs;
}
