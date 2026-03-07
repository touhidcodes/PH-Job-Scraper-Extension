import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { clearHighlight, highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeGenericRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const seenIds = new Set<string>();

  const cardSelectors = "article, .job, .job-card, [class*='job'], [itemtype*='JobPosting'], [class*='Listing'], .card";
  const cards = Array.from(document.querySelectorAll(cardSelectors));

  console.log(`Nexen Scraper: Generic mode activated on ${cards.length} potential cards...`);
  emitScrapeProgress({ current: 0, total: cards.length, title: "Connecting..." });

  for (const card of cards) {
    if (jobs.length >= 100) break;

    // Use a multi-strategy for title
    const titleEl = card.querySelector("h1, h2, h3, h4, a[href*='job'], [class*='title'], [id*='title'], strong, .name");
    const title = extractText(titleEl);
    
    // Look for company naming conventions
    const companyEl = card.querySelector("[class*='company'], [class*='employer'], [class*='brand'], .comp-name, .startup, .vendor");
    const company = extractText(companyEl) || location.hostname;

    if (!title || title.length < 3) continue;
    
    // Deduplication via title-company fingerprint
    const fingerprint = `${title}-${company}`.toLowerCase().replace(/\s+/g, "");
    if (seenIds.has(fingerprint)) continue;
    seenIds.add(fingerprint);

    highlight(card);

    const locationEl = card.querySelector("[class*='location'], [class*='city'], .loc, .geo, .address");
    const salaryEl = card.querySelector("[class*='salary'], [class*='pay'], [class*='comp'], .money, .rate");
    const jobTypeEl = card.querySelector("[class*='type'], [class*='nature'], .fulltime, .contract");
    const urlEl = (card.querySelector("a[href*='job']") as HTMLAnchorElement) || 
                 (card.querySelector("a") as HTMLAnchorElement);

    jobs.push({
      id: `generic-${Date.now()}-${jobs.length}`,
      title,
      company,
      role: title,
      location: extractText(locationEl) || "Not detected",
      deadline: "N/A",
      salary: extractText(salaryEl) || "Not disclosed",
      jobType: extractText(jobTypeEl) || "Full-time",
      url: urlEl?.href || location.href,
      platform: location.hostname,
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ 
      current: jobs.length, 
      total: cards.length, 
      title: `${company}: ${title}`,
      scrollPercent: (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
    });

    await new Promise((res) => setTimeout(res, 250));
  }

  clearHighlight();
  return jobs;
}
