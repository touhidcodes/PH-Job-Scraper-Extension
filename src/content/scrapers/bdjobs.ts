import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";
import { emitScrapeProgress } from "../utils/progress";

export async function scrapeBDJobsRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = Array.from(
    document.querySelectorAll(
      ".job-list-item, .single-job-items, article"
    )
  );

  const total = cards.length;
  emitScrapeProgress({ current: 0, total, title: "" });

  let index = 0;

  for (const card of cards) {
    highlight(card);

    const title = extractText(
      card.querySelector("h1, h2, h3, [class*='title']")
    );
    if (!title) continue;

    jobs.push({
      id: `bdjobs-${Date.now()}-${index++}`,
      title,
      company: extractText(
        card.querySelector("[class*='company'], [class*='employer']")
      ),
      role: title,
      location:
        extractText(card.querySelector("[class*='location']")) || "Bangladesh",
      deadline:
        extractText(card.querySelector("[class*='deadline'], .date")) || "N/A",
      salary: extractText(card.querySelector("[class*='salary']")),
      jobType: extractText(card.querySelector("[class*='type']")),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: "BDJobs",
      scrapedAt: new Date().toISOString(),
    });

    emitScrapeProgress({ current: jobs.length, total, title });
    await new Promise((res) => setTimeout(res, 400));
  }

  return jobs;
}
