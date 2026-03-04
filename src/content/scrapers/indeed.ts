import type { JobListing } from "../../types";
import { extractText } from "../utils/dom";
import { highlight } from "../utils/highlight";

export async function scrapeIndeedRealtime(): Promise<JobListing[]> {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    ".job_seen_beacon, .tapItem, [data-jk]"
  );

  let index = 0;

  for (const card of Array.from(cards)) {
    highlight(card);

    const title = extractText(card.querySelector("h2 span, .jobTitle"));
    if (!title) continue;

    jobs.push({
      id: `indeed-${Date.now()}-${index++}`,
      title,
      company: extractText(
        card.querySelector(".companyName, [data-testid='company-name']")
      ),
      role: title,
      location: extractText(
        card.querySelector(".companyLocation, [data-testid='text-location']")
      ),
      deadline: "N/A",
      salary: extractText(card.querySelector(".salary-snippet")),
      jobType: extractText(card.querySelector(".attribute_snippet")),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ?? location.href,
      platform: "Indeed",
      scrapedAt: new Date().toISOString(),
    });

    await new Promise((res) => setTimeout(res, 350));
  }

  return jobs;
}
