import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeGenericRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = Array.from(
    document.querySelectorAll(
      "article, .job, .job-card, [class*='job'], [itemtype*='JobPosting']"
    )
  );

  const total = cards.length;
  emitScrapeProgress({ current: 0, total, title: "" });

  let index = 0;

  for (const card of cards) {
    highlight(card);

    const title = extractText(card.querySelector("h1, h2, h3, a, strong"));
    if (!title || title.length < 3) continue;

    jobs.push({
      id: `generic-${Date.now()}-${index++}`,
      title,
      company: extractText(
        card.querySelector("[class*='company'], [class*='employer']")
      ),
      role: title,
      location: extractText(
        card.querySelector("[class*='location'], [class*='city']")
      ),
      deadline: "N/A",
      salary: extractText(
        card.querySelector("[class*='salary'], [class*='pay']")
      ),
      jobType: extractText(card.querySelector("[class*='type']")),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: location.hostname,
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ current: jobs.length, total, title });
    await new Promise((res) => setTimeout(res, 300));
  }

  return jobs;
}
