const rows = document.querySelectorAll(".job-title-text");
const jobs = Array.from(rows).map((el) => ({
    title: el.textContent?.trim() || "",
    company: el
        .closest(".joblist")
        ?.querySelector(".company-name")
        ?.textContent?.trim() || "",
    location: "",
    url: el.href || "",
    source: "Bdjobs",
}));
chrome.runtime.sendMessage({ type: "SCRAPED_JOBS", payload: jobs });
export {};
