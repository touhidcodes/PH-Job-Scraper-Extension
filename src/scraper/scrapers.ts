import type { JobListing, PlatformKey } from "../types";

const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

const cleanText = (text: string | null | undefined): string =>
  text?.replace(/\s+/g, " ").trim() ?? "";

const detectPlatform = (hostname: string): PlatformKey => {
  if (hostname.includes("linkedin.com")) return "linkedin";
  if (hostname.includes("wellfound.com") || hostname.includes("angel.co"))
    return "wellfound";
  if (hostname.includes("bdjobs.com")) return "bdjobs";
  if (hostname.includes("indeed.com")) return "indeed";
  if (hostname.includes("glassdoor.com")) return "glassdoor";
  if (hostname.includes("jobstreet.com")) return "jobstreet";
  if (hostname.includes("naukri.com")) return "naukri";
  if (hostname.includes("monster.com")) return "monster";
  return "generic";
};

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
const scrapeLinkedIn = (): JobListing[] => {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    ".jobs-search__results-list li, .job-card-container, [data-job-id]"
  );

  cards.forEach((card) => {
    const title = cleanText(
      card.querySelector(".job-card-list__title, .base-search-card__title, h3")
        ?.textContent
    );
    const company = cleanText(
      card.querySelector(
        ".job-card-container__company-name, .base-search-card__subtitle, h4"
      )?.textContent
    );
    const location = cleanText(
      card.querySelector(
        '.job-card-container__metadata-item, .job-search-card__location, [class*="location"]'
      )?.textContent
    );
    const url =
      card
        .querySelector('a[href*="/jobs/view/"], a[href*="/jobs/"]')
        ?.getAttribute("href") ?? "";

    if (title) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "N/A",
        platform: "LinkedIn",
        url: url
          ? `https://linkedin.com${url.split("?")[0]}`
          : window.location.href,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return jobs;
};

// ─── Wellfound / AngelList ────────────────────────────────────────────────────
const scrapeWellfound = (): JobListing[] => {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    '[class*="JobListing"], [data-cy="job-listing"]'
  );

  cards.forEach((card) => {
    const title = cleanText(
      card.querySelector('h2, h3, [class*="title"]')?.textContent
    );
    const company = cleanText(
      card.querySelector('[class*="company"], [class*="startup"]')?.textContent
    );
    const location = cleanText(
      card.querySelector('[class*="location"]')?.textContent
    );
    const salary = cleanText(
      card.querySelector('[class*="salary"], [class*="compensation"]')
        ?.textContent
    );
    const jobType = cleanText(
      card.querySelector('[class*="type"], [class*="remote"]')?.textContent
    );
    const url = card.querySelector("a")?.getAttribute("href") ?? "";

    if (title) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "N/A",
        jobType,
        salary,
        platform: "Wellfound",
        url: url ? `https://wellfound.com${url}` : window.location.href,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return jobs;
};

// ─── BDJobs ───────────────────────────────────────────────────────────────────
const scrapeBDJobs = (): JobListing[] => {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    ".job-titlle, .single-job-item, .job-listing-item, tr.job-row"
  );

  cards.forEach((card) => {
    const title = cleanText(
      card.querySelector('.job-title, a[href*="/job/"], h3, td:first-child')
        ?.textContent
    );
    const company = cleanText(
      card.querySelector(".company-name, .org-name, td:nth-child(2)")
        ?.textContent
    );
    const location = cleanText(
      card.querySelector(
        '[class*="location"], [class*="address"], td:nth-child(3)'
      )?.textContent
    );
    const deadline = cleanText(
      card.querySelector('[class*="deadline"], [class*="date"], td:last-child')
        ?.textContent
    );
    const url = card.querySelector("a")?.getAttribute("href") ?? "";

    if (title) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "Bangladesh",
        deadline,
        platform: "BDJobs",
        url: url || window.location.href,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return jobs;
};

// ─── Indeed ───────────────────────────────────────────────────────────────────
const scrapeIndeed = (): JobListing[] => {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    '.job_seen_beacon, .slider_container, [class*="job_seen"]'
  );

  cards.forEach((card) => {
    const title = cleanText(
      card.querySelector(".jobTitle, h2 a span")?.textContent
    );
    const company = cleanText(
      card.querySelector('.companyName, [class*="companyName"]')?.textContent
    );
    const location = cleanText(
      card.querySelector('.companyLocation, [class*="companyLocation"]')
        ?.textContent
    );
    const salary = cleanText(
      card.querySelector('.salary-snippet, [class*="salary"]')?.textContent
    );
    const url =
      card
        .querySelector('a.jcs-JobTitle, a[href*="/rc/clk"]')
        ?.getAttribute("href") ?? "";

    if (title) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "N/A",
        salary,
        platform: "Indeed",
        url: url ? `https://indeed.com${url}` : window.location.href,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return jobs;
};

// ─── Glassdoor ───────────────────────────────────────────────────────────────
const scrapeGlassdoor = (): JobListing[] => {
  const jobs: JobListing[] = [];
  const cards = document.querySelectorAll(
    '[data-test="job-link"], .react-job-listing, li[class*="JobsList"]'
  );

  cards.forEach((card) => {
    const title = cleanText(
      card.querySelector('[class*="jobTitle"], a[data-test]')?.textContent
    );
    const company = cleanText(
      card.querySelector('[class*="employer"], [class*="companyName"]')
        ?.textContent
    );
    const location = cleanText(
      card.querySelector('[class*="location"], [class*="loc"]')?.textContent
    );
    const salary = cleanText(
      card.querySelector('[class*="salary"]')?.textContent
    );

    if (title) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "N/A",
        salary,
        platform: "Glassdoor",
        url: window.location.href,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return jobs;
};

// ─── Generic Scraper ─────────────────────────────────────────────────────────
const scrapeGeneric = (): JobListing[] => {
  const jobs: JobListing[] = [];

  // Common patterns across job boards
  const jobSelectors = [
    '[class*="job-card"]',
    '[class*="job-item"]',
    '[class*="job-listing"]',
    '[class*="job-result"]',
    '[class*="vacancy"]',
    '[class*="position-item"]',
    '[class*="career-item"]',
    "[data-job]",
    "[data-jobid]",
  ];

  const titleSelectors = [
    'h1[class*="title"]',
    'h2[class*="title"]',
    'h3[class*="title"]',
    '[class*="job-title"]',
    '[class*="position-title"]',
    '[class*="role"]',
    'a[href*="job"]',
    'a[href*="career"]',
  ];

  const companySelectors = [
    '[class*="company"]',
    '[class*="employer"]',
    '[class*="organization"]',
    '[class*="org-name"]',
  ];

  const locationSelectors = [
    '[class*="location"]',
    '[class*="address"]',
    '[class*="city"]',
    '[class*="place"]',
  ];

  const deadlineSelectors = [
    '[class*="deadline"]',
    '[class*="expiry"]',
    '[class*="expire"]',
    '[class*="apply-by"]',
    '[class*="closing"]',
  ];

  const containers = document.querySelectorAll(jobSelectors.join(", "));

  containers.forEach((card) => {
    const title = cleanText(
      card.querySelector(titleSelectors.join(", "))?.textContent
    );
    const company = cleanText(
      card.querySelector(companySelectors.join(", "))?.textContent
    );
    const location = cleanText(
      card.querySelector(locationSelectors.join(", "))?.textContent
    );
    const deadline = cleanText(
      card.querySelector(deadlineSelectors.join(", "))?.textContent
    );
    const url =
      card.querySelector("a")?.getAttribute("href") ?? window.location.href;

    if (title && title.length > 3) {
      jobs.push({
        id: generateId(),
        title,
        company: company || "N/A",
        location: location || "N/A",
        deadline: deadline || undefined,
        platform: new URL(window.location.href).hostname.replace("www.", ""),
        url,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  // Fallback: scan structured data (JSON-LD)
  if (jobs.length === 0) {
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((script) => {
        try {
          const data = JSON.parse(script.textContent ?? "{}");
          const items = Array.isArray(data) ? data : [data];
          items.forEach((item) => {
            if (item["@type"] === "JobPosting") {
              jobs.push({
                id: generateId(),
                title: item.title || "N/A",
                company: item.hiringOrganization?.name || "N/A",
                location:
                  item.jobLocation?.address?.addressLocality ||
                  item.jobLocation?.address?.addressRegion ||
                  "N/A",
                deadline: item.validThrough
                  ? new Date(item.validThrough).toLocaleDateString()
                  : undefined,
                salary: item.baseSalary?.value?.value
                  ? `${item.baseSalary.currency} ${item.baseSalary.value.value}`
                  : undefined,
                jobType: item.employmentType,
                url: item.url || window.location.href,
                platform: new URL(window.location.href).hostname.replace(
                  "www.",
                  ""
                ),
                scrapedAt: new Date().toISOString(),
              });
            }
          });
        } catch {
          // ignore parse errors
        }
      });
  }

  return jobs;
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const scrapeJobs = (): JobListing[] => {
  const hostname = window.location.hostname;
  const platform = detectPlatform(hostname);

  const scrapers: Record<PlatformKey, () => JobListing[]> = {
    linkedin: scrapeLinkedIn,
    wellfound: scrapeWellfound,
    bdjobs: scrapeBDJobs,
    indeed: scrapeIndeed,
    glassdoor: scrapeGlassdoor,
    jobstreet: scrapeGeneric,
    naukri: scrapeGeneric,
    monster: scrapeGeneric,
    generic: scrapeGeneric,
  };

  const specificJobs = scrapers[platform]();

  // If platform-specific scraper found nothing, try generic
  if (specificJobs.length === 0 && platform !== "generic") {
    return scrapeGeneric();
  }

  return specificJobs;
};
