import { Job } from "../types";

const cards = document.querySelectorAll("[data-test='JobListing']");

const jobs: Job[] = Array.from(cards).map((el) => ({
  title: el.querySelector("h2")?.textContent?.trim() || "",
  company: el.querySelector("h4")?.textContent?.trim() || "",
  location: "",
  url: window.location.href,
  source: "Wellfound",
}));

chrome.runtime.sendMessage({ type: "SCRAPED_JOBS", payload: jobs });
