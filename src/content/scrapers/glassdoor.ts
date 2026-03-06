import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeGlassdoorRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = Array.from(
    document.querySelectorAll(
      '[data-test="jobListing"], li[class*="jobListItem"]'
    )
  );

  const total = cards.length;
  emitScrapeProgress({ current: 0, total, title: "" });

  let index = 0;

  for (const card of cards) {
    highlight(card);

    const title = extractText(
      card.querySelector("[data-test='job-title'], [class*='jobTitle']")
    );
    if (!title) continue;

    jobs.push({
      id: `glassdoor-${Date.now()}-${index++}`,
      title,
      company: extractText(card.querySelector("[data-test='employer-name']")),
      role: title,
      location: extractText(card.querySelector("[data-test='emp-location']")),
      deadline: "N/A",
      salary: extractText(card.querySelector("[data-test='detailSalary']")),
      jobType: "N/A",
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: "Glassdoor",
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ current: jobs.length, total, title });
    await new Promise((res) => setTimeout(res, 400));
  }

  return jobs;
}
