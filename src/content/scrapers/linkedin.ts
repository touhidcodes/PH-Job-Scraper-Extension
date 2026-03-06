import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeLinkedInRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = Array.from(
    document.querySelectorAll(
      ".jobs-search-results__list-item, .job-card-container"
    )
  );

  const total = cards.length;
  emitScrapeProgress({ current: 0, total, title: "" });

  let index = 0;

  for (const card of cards) {
    highlight(card);

    const title = extractText(card.querySelector(".job-card-list__title"));
    if (!title) continue;

    jobs.push({
      id: `linkedin-${Date.now()}-${index++}`,
      title,
      company: extractText(
        card.querySelector(".job-card-container__company-name")
      ),
      role: title,
      location: extractText(
        card.querySelector(".job-card-container__metadata-item")
      ),
      deadline: "N/A",
      salary: "N/A",
      jobType: "N/A",
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: "LinkedIn",
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ current: jobs.length, total, title });
    await new Promise((res) => setTimeout(res, 400));
  }

  return jobs;
}
