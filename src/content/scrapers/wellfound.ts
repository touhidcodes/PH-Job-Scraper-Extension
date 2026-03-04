import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";

export async function scrapeWellfoundRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    '[data-test="StartupResult"], [class*="JobListingCard"], .job-listing'
  );

  let index = 0;

  for (const card of Array.from(cards)) {
    highlight(card);

    const title = extractText(
      card.querySelector("h2, h3, [class*='title'], [class*='role']")
    );
    if (!title) continue;

    jobs.push({
      id: `wellfound-${Date.now()}-${index++}`,
      title,
      company: extractText(
        card.querySelector("[class*='company'], [class*='startup']")
      ),
      role: title,
      location:
        extractText(card.querySelector("[class*='location']")) || "Remote",
      deadline: "N/A",
      salary: extractText(card.querySelector("[class*='salary']")),
      jobType: extractText(card.querySelector("[class*='type']")),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: "Wellfound",
      scrapedAt: new Date().toISOString(),
    });

    await new Promise((res) => setTimeout(res, 400));
  }

  return jobs;
}
