import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ChromeMessage, ScrapeResult } from "../types";

type Status = "idle" | "scraping" | "success" | "error";

const SUPPORTED_PLATFORMS = [
  { name: "LinkedIn", color: "#0A66C2", pattern: "linkedin.com" },
  { name: "Wellfound", color: "#ff4d00", pattern: "wellfound.com" },
  { name: "BDJobs", color: "#e91e63", pattern: "bdjobs.com" },
  { name: "Indeed", color: "#003a9b", pattern: "indeed.com" },
  { name: "Glassdoor", color: "#0caa41", pattern: "glassdoor.com" },
  { name: "Any Job Site", color: "#6c63ff", pattern: "*" },
];

export const Popup = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    title: "",
  });

  /* -------------------------------------------------- */
  /* Detect active tab                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        setCurrentTab(tab);
        setCurrentUrl(tab.url || "");
      }
    });
  }, []);

  /* -------------------------------------------------- */
  /* Listen to progress updates from content script     */
  /* -------------------------------------------------- */
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === "SCRAPE_PROGRESS") {
        setProgress(msg.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const detectedPlatform =
    SUPPORTED_PLATFORMS.find(
      (p) => p.pattern !== "*" && currentUrl.includes(p.pattern)
    ) || (currentUrl ? SUPPORTED_PLATFORMS[5] : null);

  /* -------------------------------------------------- */
  /* Trigger scrape                                     */
  /* -------------------------------------------------- */
  const handleScrape = async () => {
    if (!currentTab?.id) return;

    setStatus("scraping");
    setError("");
    setResult(null);
    setProgress({ current: 0, total: 0, title: "" });

    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, {
        type: "SCRAPE_JOBS",
      } as ChromeMessage);

      if (response?.success) {
        setResult(response);
        setStatus("success");
      } else {
        setError(response?.error || "Failed to scrape jobs");
        setStatus("error");
      }
    } catch {
      setError("Cannot connect to page. Refresh the tab and try again.");
      setStatus("error");
    }
  };

  const handleViewResults = () => {
    if (!result) return;
    chrome.runtime.sendMessage({
      type: "OPEN_RESULTS",
      payload: result,
    });
  };

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */
  return (
    <div className="w-[380px] min-h-[500px] bg-obsidian relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-2xl" />

      {/* Header */}
      <header className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-bright flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-text">PH Job Scraper</h1>
            <p className="text-[10px] font-mono text-neon uppercase tracking-widest">
              realtime dom extractor
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-surface border border-border flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-neon rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-neon-dim">READY</span>
        </div>
      </header>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-5" />

      {/* Current URL */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-mono text-muted uppercase mb-2">
          Current Page
        </p>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border">
          <Globe size={14} className="text-muted" />
          <span className="text-[11px] font-mono text-text-dim truncate flex-1">
            {currentUrl || "No active tab"}
          </span>

          {detectedPlatform && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: `${detectedPlatform.color}20`,
                color: detectedPlatform.color,
              }}
            >
              {detectedPlatform.name}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 flex-1">
        <button
          onClick={handleScrape}
          disabled={status === "scraping"}
          className={`w-full rounded-2xl py-3.5 font-semibold flex flex-col items-center justify-center transition-all
            ${
              status === "scraping"
                ? "bg-accent/15 border border-accent/30 text-accent"
                : "bg-gradient-to-r from-accent to-accent-bright text-white hover:shadow-lg"
            }`}
        >
          {status === "scraping" ? (
            <>
              <Loader2 size={18} className="animate-spin mb-2" />
              <span className="text-[12px]">Scraping jobs…</span>

              {progress.total > 0 && (
                <>
                  <p className="text-[10px] font-mono text-muted truncate max-w-[260px] mt-1">
                    {progress.title}
                  </p>

                  <div className="w-full h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent-bright transition-all"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-[10px] font-mono text-muted mt-1">
                    {progress.current} / {progress.total}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <Zap size={16} />
              <span className="mt-1">Extract Jobs</span>
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {status === "success" && result && (
        <div className="px-5 pt-3">
          <div className="p-4 rounded-2xl bg-surface border border-neon/30">
            <div className="flex gap-3">
              <CheckCircle2 size={18} className="text-neon" />
              <div>
                <p className="font-semibold text-text text-[13px]">
                  🎉 {result.totalFound} jobs scraped
                </p>
                <p className="text-[11px] font-mono text-muted">
                  from {result.platform}
                </p>
              </div>
            </div>

            <button
              onClick={handleViewResults}
              className="mt-3 w-full py-2 rounded-xl bg-neon/10 border border-neon/20 text-neon text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-neon/20"
            >
              View & Export
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="px-5 pt-3">
          <div className="p-4 rounded-2xl bg-surface border border-danger/30">
            <div className="flex gap-3">
              <AlertCircle size={18} className="text-danger" />
              <div>
                <p className="font-semibold text-text text-[13px]">
                  Scrape Failed
                </p>
                <p className="text-[11px] font-mono text-muted">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-5 py-4 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono">
          <Search size={10} />
          Smart DOM Scanner
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-muted hover:text-accent"
        >
          GitHub <ExternalLink size={9} />
        </a>
      </footer>
    </div>
  );
};
