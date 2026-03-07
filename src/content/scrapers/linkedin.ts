import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeLinkedInRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();
  
  // LinkedIn uses lazy loading heavily, so we need to scroll to find them
  const TIMEOUT = 1000;
  const MAX_JOBS = 100;

  console.log("Nexen Scraper: Starting LinkedIn deep scan...");

  // Primary selector for search result cards
  const cardSelectors = [
    ".jobs-search-results__list-item",
    ".job-card-container",
    ".base-card",
    "[data-job-id]"
  ].join(",");

  let previousCardCount = 0;
  let scrollAttempts = 0;

  while (jobs.length < MAX_JOBS && scrollAttempts < 5) {
    const cards = Array.from(document.querySelectorAll(cardSelectors));

    if (cards.length === previousCardCount) {
      scrollAttempts++;
      // Scroll list container if it exists, otherwise window
      const listContainer = document.querySelector(".jobs-search-results-list");
      if (listContainer) {
        listContainer.scrollBy(0, 800);
      } else {
        window.scrollBy(0, 800);
      }
      await new Promise(r => setTimeout(r, TIMEOUT));
    } else {
      scrollAttempts = 0;
    }
    
    previousCardCount = cards.length;

    for (const card of cards) {
      if (jobs.length >= MAX_JOBS) break;

      // Fingerprint to avoid duplicates
      const jobId = card.getAttribute("data-job-id") || 
                    card.getAttribute("data-entity-urn")?.split(":").pop() || 
                    "";
      
      const titleEl = card.querySelector(".job-card-list__title, .base-search-card__title, h2, h3");
      const title = extractText(titleEl);
      const companyEl = card.querySelector(".job-card-container__company-name, .base-search-card__subtitle, [class*='company']");
      const company = extractText(companyEl);

      if (!title || !company) continue;
      
      const fingerprint = jobId || `${title}-${company}`.toLowerCase();
      if (seenIds.has(fingerprint)) continue;
      seenIds.add(fingerprint);

      highlight(card);

      const locationEl = card.querySelector(".job-card-container__metadata-item, .job-search-card__location, [class*='location']");
      const salaryEl = card.querySelector(".job-card-list__footer-item, [class*='salary']");
      const urlEl = card.querySelector("a.job-card-list__title, a.base-card__full-link, a") as HTMLAnchorElement;

      jobs.push({
        id: `linkedin-${Date.now()}-${jobs.length}`,
        title,
        company,
        role: title,
        location: extractText(locationEl) || "Not listed",
        deadline: "N/A",
        salary: extractText(salaryEl) || "Not listed",
        jobType: "N/A",
        url: urlEl?.href || location.href,
        platform: "LinkedIn",
        scrapedAt: new Date().toISOString(),
      });

      emitScrapeProgress({ 
        current: jobs.length, 
        total: Math.max(jobs.length, cards.length), 
        title: `${company}: ${title}` 
      });

      await new Promise((res) => setTimeout(res, 200));
    }
  }

  clearHighlight();
  return jobs;
}
