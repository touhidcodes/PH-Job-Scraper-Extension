import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeBDJobsRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();
  
  const cardSelectors = ".job-list-item, .single-job-items, .norm-jobs-wrapper, .view_job_details, article";
  const cards = Array.from(document.querySelectorAll(cardSelectors));

  console.log(`Nexen Scraper: Initializing BDJobs extraction on ${cards.length} potential cards...`);
  emitScrapeProgress({ current: 0, total: cards.length, title: "Connecting..." });

  for (const card of cards) {
    if (jobs.length >= 100) break;

    const titleEl = card.querySelector("h1, h2, h3, [class*='title'], .job-title, a[href*='jobdetails']");
    const title = extractText(titleEl);
    
    // Look for company. Can be in .comp-name or similar
    const companyEl = card.querySelector("[class*='company'], [class*='employer'], .comp-name, .company-name");
    const company = extractText(companyEl);

    if (!title || !company) continue;
    
    const fingerprint = `${title}-${company}`.toLowerCase().replace(/\s+/g, "");
    if (seenIds.has(fingerprint)) continue;
    seenIds.add(fingerprint);

    highlight(card);

    const locationEl = card.querySelector("[class*='location'], .locn, .job-location");
    const deadlineEl = card.querySelector("[class*='deadline'], .date, .exp-date");
    const salaryEl = card.querySelector("[class*='salary'], .salary");
    const jobTypeEl = card.querySelector("[class*='type'], .job-type");
    const urlEl = (card.querySelector("a[href*='jobdetails']") as HTMLAnchorElement) || 
                 (card.querySelector("a") as HTMLAnchorElement);

    jobs.push({
      id: `bdjobs-${Date.now()}-${jobs.length}`,
      title,
      company,
      role: title,
      location: extractText(locationEl) || "Bangladesh",
      deadline: extractText(deadlineEl) || "N/A",
      salary: extractText(salaryEl) || "Negotiable",
      jobType: extractText(jobTypeEl) || "Full-time",
      url: urlEl?.href || location.href,
      platform: "BDJobs",
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ 
      current: jobs.length, 
      total: cards.length, 
      title: `${company}: ${title}`,
      scrollPercent: (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
    });

    await new Promise((res) => setTimeout(res, 350));
  }

  clearHighlight();
  return jobs;
}
