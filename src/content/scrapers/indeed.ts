import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeIndeedRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();
  
  const MAX_JOBS = 100;
  console.log("Nexen Scraper: Starting Indeed deep scan...");

  const getCards = () => Array.from(
    document.querySelectorAll(
      ".job_seen_beacon, [id^='job_'], .tapItem, [data-jk]"
    )
  );

  let cards = getCards();
  emitScrapeProgress({ current: 0, total: cards.length, title: "Initializing..." });

  for (const card of cards) {
    if (jobs.length >= MAX_JOBS) break;

    const jk = card.getAttribute("data-jk") || "";
    const titleEl = card.querySelector("h2 span[id^='jobTitle'], .jobTitle, h2");
    const title = extractText(titleEl);
    const companyEl = card.querySelector(".companyName, [data-testid='company-name'], .css-1x7z1ps");
    const company = extractText(companyEl);

    if (!title || !company) continue;
    
    const fingerprint = jk || `${title}-${company}`.toLowerCase();
    if (seenIds.has(fingerprint)) continue;
    seenIds.add(fingerprint);

    highlight(card);

    const locationEl = card.querySelector(".companyLocation, [data-testid='text-location'], .css-1p6cc6");
    const salaryEl = card.querySelector(".salary-snippet, .salary-snippet-container, .estimated-salary, .css-1cv9mv");
    const jobTypeEl = card.querySelector(".attribute_snippet, .css-1cv9mv");

    jobs.push({
      id: `indeed-${Date.now()}-${jobs.length}`,
      title,
      company,
      role: title,
      location: extractText(locationEl) || "Location not listed",
      deadline: "N/A",
      salary: extractText(salaryEl) || "Not listed",
      jobType: extractText(jobTypeEl) || "Full-time",
      url: (card.querySelector("a[data-jk]") as HTMLAnchorElement)?.href || 
           (card.querySelector("a") as HTMLAnchorElement)?.href || 
           location.href,
      platform: "Indeed",
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ 
      current: jobs.length, 
      total: cards.length, 
      title: `${company}: ${title}`,
      scrollPercent: (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
    });

    await new Promise((res) => setTimeout(res, 300));
  }

  clearHighlight();
  return jobs;
}
