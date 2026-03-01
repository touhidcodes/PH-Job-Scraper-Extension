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

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        setCurrentTab(tab);
        setCurrentUrl(tab.url || "");
      }
    });
  }, []);

  const detectedPlatform =
    SUPPORTED_PLATFORMS.find(
      (p) => p.pattern !== "*" && currentUrl.includes(p.pattern)
    ) || (currentUrl ? SUPPORTED_PLATFORMS[5] : null);

  const handleScrape = async () => {
    if (!currentTab?.id) return;
    setStatus("scraping");
    setError("");
    setResult(null);

    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, {
        type: "SCRAPE_JOBS",
      } as ChromeMessage);

      if (response?.type === "SCRAPE_RESULT") {
        const scrapeResult = response.payload as ScrapeResult;
        setResult(scrapeResult);
        setStatus("success");
      } else if (response?.type === "SCRAPE_ERROR") {
        setError(response.payload?.message || "Failed to scrape jobs");
        setStatus("error");
      }
    } catch (err) {
      setError("Cannot connect to page. Try refreshing and retry.");
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

  return (
    <div className="w-[380px] min-h-[480px] bg-obsidian grid-bg relative overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <header className="relative px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-bright flex items-center justify-center glow-accent">
              <Briefcase size={17} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-text text-[15px] leading-tight tracking-tight">
                PH Job Scraper
              </h1>
              <p className="text-[10px] font-mono text-neon tracking-widest uppercase">
                v1.0.0 — Extract &amp; Export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-slow" />
            <span className="text-[10px] font-mono text-neon-dim">READY</span>
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-5" />

      {/* Current Page Info */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2">
          Current Page
        </p>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border">
          <Globe size={14} className="text-muted flex-shrink-0" />
          <span className="text-[11px] text-text-dim font-mono truncate flex-1">
            {currentUrl || "No tab detected"}
          </span>
          {detectedPlatform && (
            <span
              className="text-[10px] font-display font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: `${detectedPlatform.color}20`,
                color: detectedPlatform.color,
                border: `1px solid ${detectedPlatform.color}40`,
              }}
            >
              {detectedPlatform.name}
            </span>
          )}
        </div>
      </div>

      {/* Supported Platforms */}
      <div className="px-5 mb-4">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-2.5">
          Supported Platforms
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_PLATFORMS.slice(0, 5).map((p) => (
            <span
              key={p.name}
              className="text-[10px] px-2 py-0.5 rounded-md font-mono"
              style={{
                backgroundColor: `${p.color}15`,
                color: p.color,
                border: `1px solid ${p.color}30`,
              }}
            >
              {p.name}
            </span>
          ))}
          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-surface border border-border text-muted">
            + more
          </span>
        </div>
      </div>

      {/* Main CTA */}
      <div className="px-5 flex-1">
        <button
          onClick={handleScrape}
          disabled={status === "scraping" || !currentUrl}
          className={`
            w-full py-3.5 px-5 rounded-2xl font-display font-semibold text-[14px]
            flex items-center justify-center gap-2.5 transition-all duration-200
            ${
              status === "scraping"
                ? "bg-accent/20 border border-accent/30 text-accent cursor-not-allowed"
                : "bg-gradient-to-r from-accent to-accent-bright text-white hover:from-accent-bright hover:to-accent shadow-lg shadow-accent/25 active:scale-[0.98]"
            }
          `}
        >
          {status === "scraping" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Scanning DOM...
            </>
          ) : (
            <>
              <Zap size={16} />
              Extract Jobs
            </>
          )}
        </button>
      </div>

      {/* Status / Result */}
      {(status === "success" || status === "error") && (
        <div className="px-5 pt-3 animate-slide-up">
          {status === "success" && result && (
            <div className="p-4 rounded-2xl bg-surface border border-neon/20">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="text-neon flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-text text-[13px]">
                    Found{" "}
                    <span className="text-neon">{result.totalFound} jobs</span>
                  </p>
                  <p className="text-[11px] text-muted font-mono mt-0.5 truncate">
                    from {result.platform}
                  </p>
                </div>
              </div>

              <button
                onClick={handleViewResults}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-neon/10 border border-neon/20 
                  text-neon text-[12px] font-display font-semibold flex items-center justify-center gap-2
                  hover:bg-neon/20 transition-colors group"
              >
                View &amp; Export Results
                <ChevronRight
                  size={13}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="p-4 rounded-2xl bg-surface border border-danger/20">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-danger flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-display font-semibold text-text text-[13px]">
                    Scrape Failed
                  </p>
                  <p className="text-[11px] text-muted font-mono mt-0.5 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={handleScrape}
                className="mt-3 w-full py-2 rounded-xl bg-danger/10 border border-danger/20 
                  text-danger text-[12px] font-mono hover:bg-danger/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help tip */}
      <div className="px-5 py-4 mt-2">
        <p className="text-[10px] text-muted font-mono text-center leading-relaxed">
          Navigate to a job listings page, then click Extract Jobs.
          <br />
          Works on any site with job data.
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Search size={10} className="text-muted" />
            <span className="text-[10px] font-mono text-muted">
              Smart DOM Scanner
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-muted hover:text-accent transition-colors"
          >
            GitHub <ExternalLink size={9} />
          </a>
        </div>
      </div>
    </div>
  );
};
