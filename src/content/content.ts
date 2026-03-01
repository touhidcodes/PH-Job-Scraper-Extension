import type { JobListing, Platform, ScrapeResult } from "../types";

function detectPlatform(): Platform {
  const host = window.location.hostname.toLowerCase();
  if (host.includes("linkedin")) return "linkedin";
  if (host.includes("wellfound") || host.includes("angel.co"))
    return "wellfound";
  if (host.includes("bdjobs")) return "bdjobs";
  if (host.includes("indeed")) return "indeed";
  if (host.includes("glassdoor")) return "glassdoor";
  if (host.includes("monster")) return "monster";
  return "generic";
}

function cleanText(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function generateId(index: number, platform: string): string {
  return `${platform}-${Date.now()}-${index}`;
}

function extractAttr(el: Element | null, attr: string): string {
  return cleanText(el?.getAttribute(attr));
}

function extractText(el: Element | null): string {
  return cleanText(el?.textContent);
}

// ─── Platform Scrapers ───────────────────────────────────────────────────────

function scrapeLinkedIn(): JobListing[] {
  const jobs: JobListing[] = [];

  // Multiple possible selectors for LinkedIn (they change frequently)
  const cardSelectors = [
    ".jobs-search__results-list li",
    ".job-card-container",
    ".jobs-job-board-list__item",
    "[data-job-id]",
    ".scaffold-layout__list-item",
    ".job-card-list__entity-lockup",
    ".jobs-search-results__list-item",
  ];

  let cards: NodeListOf<Element> | Element[] = [];
  for (const sel of cardSelectors) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) {
      cards = found;
      break;
    }
  }

  cards.forEach((card, i) => {
    const titleEl = card.querySelector(
      '.job-card-list__title, .base-search-card__title, [data-control-name="jobcard_title"], .job-card-container__link'
    );
    const companyEl = card.querySelector(
      ".job-card-container__company-name, .base-search-card__subtitle, .job-card-list__company-name"
    );
    const locationEl = card.querySelector(
      ".job-card-container__metadata-item, .job-search-card__location, .base-search-card__metadata"
    );
    const linkEl = card.querySelector('a[href*="/jobs/"]');

    const title = extractText(titleEl) || extractAttr(card, "aria-label");
    if (!title) return;

    jobs.push({
      id: generateId(i, "linkedin"),
      title,
      company: extractText(companyEl),
      role: title,
      location: extractText(locationEl),
      deadline: "N/A",
      salary: extractText(
        card.querySelector(".job-card-list__salary, .compensation")
      ),
      jobType: extractText(
        card.querySelector(".job-card-list__work-type, .work-type")
      ),
      url: (linkEl as HTMLAnchorElement)?.href || window.location.href,
      platform: "LinkedIn",
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

function scrapeWellfound(): JobListing[] {
  const jobs: JobListing[] = [];

  const cardSelectors = [
    '[data-test="StartupResult"]',
    ".styles_jobResult__",
    ".job-listing",
    '[class*="JobListingCard"]',
    '[class*="startup-result"]',
    'div[class*="DesktopJobSearchResult"]',
  ];

  let cards: NodeListOf<Element> | Element[] = [];
  for (const sel of cardSelectors) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) {
      cards = found;
      break;
    }
  }

  // Fallback: detect job-like divs
  if (!Array.isArray(cards) && cards.length === 0) {
    cards = Array.from(document.querySelectorAll("div"))
      .filter((div) => {
        const text = div.textContent || "";
        return (
          text.includes("Full-time") ||
          text.includes("Remote") ||
          text.includes("Engineer")
        );
      })
      .slice(0, 20);
  }

  cards.forEach((card, i) => {
    const titleEl = card.querySelector(
      'h2, h3, [class*="title"], [class*="role"]'
    );
    const companyEl = card.querySelector(
      '[class*="company"], [class*="startup"]'
    );
    const locationEl = card.querySelector(
      '[class*="location"], [class*="remote"]'
    );

    const title = extractText(titleEl);
    if (!title) return;

    jobs.push({
      id: generateId(i, "wellfound"),
      title,
      company: extractText(companyEl),
      role: title,
      location: extractText(locationEl) || "Remote",
      deadline: "N/A",
      salary: extractText(
        card.querySelector('[class*="salary"], [class*="compensation"]')
      ),
      jobType: extractText(
        card.querySelector(
          '[class*="type"], [class*="full-time"], [class*="contract"]'
        )
      ),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ||
        window.location.href,
      platform: "Wellfound",
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

function scrapeBDJobs(): JobListing[] {
  const jobs: JobListing[] = [];

  const cardSelectors = [
    ".single-job-items",
    ".jobs-item",
    ".job-list-item",
    '[class*="job-item"]',
    ".job-listing-item",
    "article",
  ];

  let cards: NodeListOf<Element> | Element[] = [];
  for (const sel of cardSelectors) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) {
      cards = found;
      break;
    }
  }

  cards.forEach((card, i) => {
    const titleEl = card.querySelector(
      'h1, h2, h3, .job-title, [class*="title"]'
    );
    const companyEl = card.querySelector(
      '[class*="company"], [class*="employer"]'
    );
    const locationEl = card.querySelector(
      '[class*="location"], [class*="area"]'
    );
    const deadlineEl = card.querySelector(
      '[class*="deadline"], [class*="expire"], .date'
    );

    const title = extractText(titleEl);
    if (!title) return;

    jobs.push({
      id: generateId(i, "bdjobs"),
      title,
      company: extractText(companyEl),
      role: title,
      location: extractText(locationEl) || "Bangladesh",
      deadline: extractText(deadlineEl) || "N/A",
      salary: extractText(card.querySelector('[class*="salary"]')),
      jobType: extractText(
        card.querySelector('[class*="type"], [class*="category"]')
      ),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ||
        window.location.href,
      platform: "BDJobs",
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

function scrapeIndeed(): JobListing[] {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    ".job_seen_beacon, .jobsearch-SerpJobCard, [data-jk], .tapItem, .css-1m4cuuf"
  );

  cards.forEach((card, i) => {
    const titleEl = card.querySelector("h2 a span, .jobTitle, .title");
    const companyEl = card.querySelector(
      '[data-testid="company-name"], .companyName, .company'
    );
    const locationEl = card.querySelector(
      '[data-testid="text-location"], .companyLocation, .location'
    );
    const salaryEl = card.querySelector(
      '[data-testid="attribute_snippet_testid"], .salary-snippet, .salaryText'
    );
    const linkEl = card.querySelector("h2 a, .jobTitle a");

    const title = extractText(titleEl);
    if (!title) return;

    jobs.push({
      id: generateId(i, "indeed"),
      title,
      company: extractText(companyEl),
      role: title,
      location: extractText(locationEl),
      deadline: "N/A",
      salary: extractText(salaryEl),
      jobType: extractText(
        card.querySelector(
          '[data-testid="attribute_snippet_testid"]:not(:first-child)'
        )
      ),
      url: (linkEl as HTMLAnchorElement)?.href || window.location.href,
      platform: "Indeed",
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

function scrapeGlassdoor(): JobListing[] {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    '[data-test="jobListing"], .react-job-listing, .job-listing, li[class*="JobsList_jobListItem"]'
  );

  cards.forEach((card, i) => {
    const titleEl = card.querySelector(
      '[data-test="job-title"], .job-title, [class*="jobTitle"]'
    );
    const companyEl = card.querySelector(
      '[data-test="employer-name"], .employer-name, [class*="employerName"]'
    );
    const locationEl = card.querySelector(
      '[data-test="emp-location"], .location, [class*="location"]'
    );
    const salaryEl = card.querySelector(
      '[data-test="detailSalary"], .salary, [class*="salary"]'
    );

    const title = extractText(titleEl);
    if (!title) return;

    jobs.push({
      id: generateId(i, "glassdoor"),
      title,
      company: extractText(companyEl),
      role: title,
      location: extractText(locationEl),
      deadline: "N/A",
      salary: extractText(salaryEl),
      jobType: "N/A",
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ||
        window.location.href,
      platform: "Glassdoor",
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

function scrapeGeneric(): JobListing[] {
  const jobs: JobListing[] = [];

  // Generic strategy: find structured job-like containers
  const potentialSelectors = [
    "article",
    ".job",
    ".job-card",
    ".job-item",
    ".vacancy",
    '[class*="job"]',
    '[class*="vacancy"]',
    '[class*="position"]',
    '[itemtype*="JobPosting"]',
    'li[class*="result"]',
  ];

  const seen = new Set<Element>();
  let cards: Element[] = [];

  for (const sel of potentialSelectors) {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el) && el.querySelectorAll("a").length > 0) {
          const text = el.textContent || "";
          if (text.length > 40 && text.length < 2000) {
            seen.add(el);
            cards.push(el);
          }
        }
      });
    } catch {}
  }

  // Deduplicate by removing children
  cards = cards.filter(
    (el) => !cards.some((other) => other !== el && other.contains(el))
  );
  cards = cards.slice(0, 50);

  cards.forEach((card, i) => {
    const headings = card.querySelectorAll("h1, h2, h3, h4, strong");
    const titleEl = headings[0] || card.querySelector("a");
    const title = extractText(titleEl);
    if (!title || title.length < 3) return;

    const allText = extractText(card);
    const locationMatch = allText.match(
      /(?:Location|Based in|Office):\s*([^\n|]+)/i
    );
    const deadlineMatch = allText.match(
      /(?:Deadline|Apply by|Closing date):\s*([^\n|]+)/i
    );

    jobs.push({
      id: generateId(i, "generic"),
      title,
      company: extractText(
        card.querySelector(
          '[class*="company"], [class*="employer"], [class*="org"]'
        )
      ),
      role: title,
      location:
        locationMatch?.[1]?.trim() ||
        extractText(card.querySelector('[class*="location"], [class*="city"]')),
      deadline: deadlineMatch?.[1]?.trim() || "N/A",
      salary: extractText(
        card.querySelector('[class*="salary"], [class*="pay"]')
      ),
      jobType: extractText(
        card.querySelector('[class*="type"], [class*="employment"]')
      ),
      url:
        (card.querySelector("a") as HTMLAnchorElement)?.href ||
        window.location.href,
      platform: window.location.hostname,
      scrapedAt: new Date().toISOString(),
    });
  });

  return jobs;
}

// ─── Main Scrape Function ────────────────────────────────────────────────────

function scrapeJobs(): ScrapeResult {
  const platform = detectPlatform();
  let jobs: JobListing[] = [];

  try {
    switch (platform) {
      case "linkedin":
        jobs = scrapeLinkedIn();
        break;
      case "wellfound":
        jobs = scrapeWellfound();
        break;
      case "bdjobs":
        jobs = scrapeBDJobs();
        break;
      case "indeed":
        jobs = scrapeIndeed();
        break;
      case "glassdoor":
        jobs = scrapeGlassdoor();
        break;
      default:
        jobs = scrapeGeneric();
    }

    // Remove duplicates by title+company
    const seen = new Set<string>();
    jobs = jobs.filter((job) => {
      const key = `${job.title}-${job.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      success: true,
      platform,
      jobs,
      totalFound: jobs.length,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      platform,
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
      totalFound: 0,
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ─── Message Listener ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_JOBS") {
    const result = scrapeJobs();
    sendResponse({ success: true, data: result });
  }
  return true;
});
