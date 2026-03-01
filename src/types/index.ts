export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType?: string;
  salary?: string;
  deadline?: string;
  postedDate?: string;
  experience?: string;
  skills?: string[];
  url?: string;
  platform: string;
  scrapedAt: string;
}

export type ExportFormat = "csv" | "xlsx";

export interface ScrapeResult {
  jobs: JobListing[];
  platform: string;
  url: string;
  count: number;
  timestamp: string;
}

export interface ChromeMessage {
  type: "SCRAPE_JOBS" | "SCRAPE_RESULT" | "SCRAPE_ERROR" | "OPEN_RESULTS";
  payload?: unknown;
}

export interface ScrapeMessage extends ChromeMessage {
  type: "SCRAPE_JOBS";
}

export interface ResultMessage extends ChromeMessage {
  type: "SCRAPE_RESULT";
  payload: ScrapeResult;
}

export interface ErrorMessage extends ChromeMessage {
  type: "SCRAPE_ERROR";
  payload: { message: string };
}

export type PlatformKey =
  | "linkedin"
  | "wellfound"
  | "bdjobs"
  | "indeed"
  | "glassdoor"
  | "jobstreet"
  | "naukri"
  | "monster"
  | "generic";
