import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";

export async function scrapeLinkedInRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    ".jobs-search-results__list-item, .job-card-container"
  );

  let index = 0;

  for (const card of Array.from(cards)) {
    highlight(card); // 🔥 visual feedback

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

    await new Promise((res) => setTimeout(res, 400)); // ⏱️ real-time effect
  }

  return jobs;
}
