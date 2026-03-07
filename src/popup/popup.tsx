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
import CountUp from "react-countup";

type Status = "idle" | "scraping" | "success" | "error";

interface ScrapeProgress {
  current: number;
  total: number;
  title: string;
}

interface ScrapeProgressMessage {
  type: "SCRAPE_PROGRESS";
  payload: ScrapeProgress;
}
interface ScrapeResult {
  success: boolean;
  totalFound: number;
  platform: string;
}

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

  const [progress, setProgress] = useState<ScrapeProgress>({
    current: 0,
    total: 0,
    title: "",
  });

  /* ---------------------- Detect Active Tab ---------------------- */

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        setCurrentTab(tab);
        setCurrentUrl(tab.url || "");
      }
    });
  }, []);

  /* ---------------------- Listen Progress ---------------------- */

  useEffect(() => {
    const listener = (msg: ScrapeProgressMessage) => {
      if (msg.type === "SCRAPE_PROGRESS") {
        setProgress(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  /* ---------------------- Detect Platform ---------------------- */

  const detectedPlatform =
    SUPPORTED_PLATFORMS.find(
      (p) => p.pattern !== "*" && currentUrl.includes(p.pattern),
    ) || (currentUrl ? SUPPORTED_PLATFORMS[5] : null);

  /* ---------------------- Start Scraping ---------------------- */

  const getActiveTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  };

  const sendScrapeCommand = async (tabId: number) => {
    try {
      return await chrome.tabs.sendMessage(tabId, { type: "SCRAPE_JOBS" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const missingReceiver =
        message.includes("Could not establish connection") ||
        message.includes("Receiving end does not exist");

      if (!missingReceiver) throw error;

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });

      return chrome.tabs.sendMessage(tabId, { type: "SCRAPE_JOBS" });
    }
  };

  const handleScrape = async () => {
      console.log("Extract button clicked");

    const tab = (await getActiveTab()) ?? currentTab;

    if (!tab?.id) {
      setError("No active tab found.");
      setStatus("error");
      return;
    }

    const canScrapeTab =
      tab.url?.startsWith("http://") || tab.url?.startsWith("https://");
    if (!canScrapeTab) {
      setError("Open a job site tab (http/https) and try again.");
      setStatus("error");
      return;
    }

    setCurrentTab(tab);
    setCurrentUrl(tab.url || "");

    setStatus("scraping");
    setError("");
    setResult(null);
    setProgress({ current: 0, total: 0, title: "" });

    try {
      const response = await sendScrapeCommand(tab.id);

      if (response?.success) {
        setResult(response);
        setStatus("success");
      } else {
        setError(response?.error || "Scraping failed");
        setStatus("error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const blockedPage =
        message.includes("Cannot access") || message.includes("chrome://");

      setError(
        blockedPage
          ? "This page is restricted. Open a normal job site tab and try again."
          : "Cannot connect to page. Try refreshing the tab.",
      );
      setStatus("error");
    }
  };

  /* ---------------------- Open Results ---------------------- */

  const handleViewResults = () => {
    if (!result) return;

    chrome.storage.local.set({ scrapeResult: result }, () => {
      chrome.runtime.sendMessage({ type: "OPEN_RESULTS" });
    });
  };

  /* ---------------------- UI ---------------------- */

  return (
    <div className="w-95 min-h-130 bg-obsidian text-text relative overflow-hidden flex flex-col">
      {/* background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-44 h-44 bg-neonBlue/20 rounded-full blur-3xl" />

      {/* header */}

      <header className="px-5 pt-5 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-accent to-accentBright flex items-center justify-center">
            <Briefcase size={16} className="text-black" />
          </div>

          <div>
            <h1 className="text-[15px] font-bold">PH Job Scraper</h1>
            <p className="text-[10px] font-mono text-neon uppercase">
              realtime dom extractor
            </p>
          </div>
        </div>

        <div className="px-2 py-1 rounded-full bg-surface border border-border flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono">READY</span>
        </div>
      </header>

      <div className="h-px bg-border mx-5" />

      {/* current url */}

      <div className="px-5 py-4">
        <p className="text-[10px] font-mono text-muted uppercase mb-2">
          Current Page
        </p>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border">
          <Globe size={14} className="text-muted" />

          <span className="text-[11px] truncate flex-1">
            {currentUrl || "No active tab"}
          </span>

          {detectedPlatform && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
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

      {/* scrape button */}

      <div className="px-5">
        <button
          onClick={handleScrape}
          disabled={status === "scraping"}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-accent to-accentBright text-black flex flex-col items-center justify-center gap-1 hover:scale-[1.02] transition"
        >
          {status === "scraping" ? (
            <>
              <Loader2 size={18} className="animate-spin" />

              <span className="text-[12px]">Scraping Jobs...</span>

              {progress.total > 0 && (
                <>
                  <div className="w-full h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-accent to-accentBright transition-all"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>

                  <span className="text-[10px] text-muted mt-1">
                    <CountUp
                      end={progress.current}
                      duration={0.35}
                      redraw
                      preserveValue
                      useEasing={false}
                    />{" "}
                    / {progress.total}
                  </span>

                  {progress.title && (
                    <span className="text-[10px] text-muted mt-0.5 truncate max-w-full">
                      {progress.title}
                    </span>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center">
              <Zap size={16} />
              <span className="text-[13px] ml-3">Extract Jobs</span>
            </div>
          )}
        </button>
      </div>

      {/* success */}

      {status === "success" && result && (
        <div className="px-5 pt-4">
          <div className="p-4 rounded-2xl bg-surface border border-neon/30">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="text-green-400" />

              <div>
                <p className="font-semibold text-[14px]">
                  <CountUp end={result.totalFound} duration={1.2} /> jobs
                  scraped
                </p>

                <p className="text-[11px] text-muted">from {result.platform}</p>
              </div>
            </div>

            <button
              onClick={handleViewResults}
              className="mt-3 w-full py-2 rounded-xl bg-neonBlue/10 border border-neonBlue/20 text-neonBlue text-[12px] flex items-center justify-center gap-2 hover:bg-neonBlue/20"
            >
              View & Export
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* error */}

      {status === "error" && (
        <div className="px-5 pt-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-3">
            <AlertCircle size={18} className="text-red-400" />

            <p className="text-[12px] text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* footer */}

      <footer className="px-5 py-4 mt-auto flex justify-between items-center text-[10px] text-muted">
        <div className="flex items-center gap-1">
          <Search size={10} />
          Smart DOM Scanner
        </div>

        <a
          href="https://github.com"
          target="_blank"
          className="flex items-center gap-1 hover:text-accent"
        >
          GitHub <ExternalLink size={10} />
        </a>
      </footer>
    </div>
  );
};
