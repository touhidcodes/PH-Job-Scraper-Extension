export interface ChromeMessage {
  type:
    | "SCRAPE_JOBS"
    | "SCRAPE_RESULT"
    | "SCRAPE_ERROR"
    | "SCRAPE_PROGRESS"
    | "OPEN_RESULTS";
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

export interface JobListing {
  id: string;
  title: string;
  company: string;
  role: string;
  location: string;
  deadline: string;
  salary: string;
  jobType: string;
  url: string;
  platform: string;
  scrapedAt: string;
}

export type Platform =
  | "linkedin"
  | "wellfound"
  | "bdjobs"
  | "indeed"
  | "glassdoor"
  | "monster"
  | "generic";

export interface ScrapeResult {
  success: boolean;
  platform: Platform;
  jobs: JobListing[];
  error?: string;
  totalFound: number;
  scrapedAt: string;
}

export interface MessageRequest {
  type: "SCRAPE_JOBS" | "GET_JOBS" | "CLEAR_JOBS" | "OPEN_RESULTS";
  data?: unknown;
}

export interface MessageResponse {
  success: boolean;
  data?: ScrapeResult | JobListing[];
  error?: string;
}

export type ExportFormat = "csv" | "excel";

export interface ExportOptions {
  format: ExportFormat;
  selectedIds: Set<string>;
  filename?: string;
}

export interface FilterState {
  search: string;
  platform: string;
  location: string;
  jobType: string;
}
