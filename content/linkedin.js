const jobs = Array.from(document.querySelectorAll("li.jobs-search-results__list-item")).map((el) => ({
    title: el.querySelector("h3")?.textContent?.trim() || "",
    company: el
        .querySelector(".job-card-container__company-name")
        ?.textContent?.trim() || "",
    location: el
        .querySelector(".job-card-container__metadata-item")
        ?.textContent?.trim() || "",
    url: el.querySelector("a")?.href || "",
    source: "LinkedIn",
}));
chrome.runtime.sendMessage({ type: "SCRAPED_JOBS", payload: jobs });
export {};
