import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Globe,
  LayoutGrid,
  RefreshCw,
  Search,
  Zap
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";

type Status = "idle" | "scraping" | "success" | "error";

interface ScrapeProgress {
  current: number;
  total: number;
  title: string;
}

interface ScrapeResult {
  success: boolean;
  totalFound: number;
  platform: string;
  error?: string;
  jobs?: any[];
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
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ScrapeProgress>({
    current: 0,
    total: 0,
    title: "",
  });

  const lastProcessedTitle = useRef("");

  /* ---------------------- Lifecycle ---------------------- */

  useEffect(() => {
    const fetchTab = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        setCurrentUrl(tab.url || "");
      }
    };

    fetchTab();

    const listener = (msg: any) => {
      if (msg.type === "SCRAPE_PROGRESS") {
        setProgress(msg.payload);
        if (msg.payload.title) {
          lastProcessedTitle.current = msg.payload.title;
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  /* ---------------------- Platform detection ---------------------- */

  const detectedPlatform =
    SUPPORTED_PLATFORMS.find(
      (p) => p.pattern !== "*" && currentUrl.includes(p.pattern),
    ) || (currentUrl ? SUPPORTED_PLATFORMS[5] : null);

  /* ---------------------- Logic ---------------------- */

  const injectContentScript = async (tabId: number) => {
    console.log("Injecting content script to tab:", tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    // Give it a moment to initialize
    await new Promise((r) => setTimeout(r, 300));
  };

  const handleScrape = async () => {
    if (status === "scraping") return;

    setStatus("scraping");
    setError("");
    setResult(null);
    setProgress({ current: 0, total: 0, title: "" });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("Could not find an active window.");

      if (!tab.url?.startsWith("http")) {
        throw new Error("This extension only works on HTTP/HTTPS websites.");
      }

      let response: ScrapeResult;
      
      try {
        console.log("Sending SCRAPE_JOBS message...");
        response = await chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_JOBS" });
      } catch (e: any) {
        console.warn("Direct message failed, re-injecting script...", e);
        await injectContentScript(tab.id);
        response = await chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_JOBS" });
      }

      if (response?.success) {
        setResult(response);
        setStatus("success");
      } else {
        throw new Error(response?.error || "Failed to extract jobs from this page.");
      }
    } catch (err: any) {
      console.error("Scraping error:", err);
      setError(err.message || "An unknown error occurred during connection.");
      setStatus("error");
    }
  };

  const handleViewResults = () => {
    if (!result) return;
    chrome.storage.local.set({ scrapeResult: result }, () => {
      chrome.runtime.sendMessage({ type: "OPEN_RESULTS" });
    });
  };

  return (
    <div className="w-[380px] min-h-[500px] bg-[#050508] text-white selection:bg-accent/30 flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-grid-bg opacity-[0.05] pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-neonBlue/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4 flex justify-between items-center bg-white/[0.01] backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accentBright flex items-center justify-center shadow-lg shadow-accent/20">
              <Briefcase size={20} className="text-black" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-white border-2 border-obsidian flex items-center justify-center">
              <Zap size={10} className="text-accent" fill="currentColor" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight">Nexen Scraper</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest">Live Scanner</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-muted uppercase">Ready</div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 p-6 flex flex-col gap-6">
        
        {/* URL Context Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Target Intel</h2>
            {detectedPlatform && (
              <span 
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-current flex items-center gap-1.5"
                style={{ color: detectedPlatform.color, backgroundColor: `${detectedPlatform.color}15` }}
              >
                <div className="w-1 h-1 rounded-full bg-current" />
                {detectedPlatform.name}
              </span>
            )}
          </div>
          <div className="group relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.05] hover:border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:text-accent transition-colors">
                <Globe size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white/50 truncate">
                  {currentUrl || "Waiting for page signal..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* State Management Area */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          
          {status === "idle" && (
             <button
             onClick={handleScrape}
             className="w-full group relative overflow-hidden py-5 rounded-3xl bg-gradient-to-r from-accent to-accentBright text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_15px_30px_-10px_rgba(255,106,0,0.3)] transition-all active:scale-95 hover:shadow-[0_20px_40px_-10px_rgba(255,106,0,0.5)]"
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
             <Zap size={20} fill="currentColor" className="relative z-10 animate-bounce" />
             <span className="relative z-10 font-syne">Extract Job Data</span>
           </button>
          )}

          {status === "scraping" && (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                   <div className="w-16 h-16 rounded-full border-t-2 border-accent animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-accent text-xs">
                     <CountUp end={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} duration={0.5} />%
                   </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm tracking-tight">Extracting Intelligence...</p>
                  <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">Live DOM Analysis</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                   <span className="text-[10px] font-bold text-accent uppercase">Progress</span>
                   <span className="text-xs font-mono font-bold text-white/80">
                     <CountUp end={progress.current} duration={0.5} /> / {progress.total || "???"}
                   </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-neon transition-all duration-500 shadow-[0_0_10px_rgba(255,106,0,0.4)]"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 10}%` }}
                  />
                </div>
                {progress.title && (
                   <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                     <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                     <p className="text-[10px] text-muted truncate italic">Scanning: {progress.title}</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {status === "success" && result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="p-6 rounded-3xl bg-green-500/5 border border-green-500/20 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Analysis Complete</h3>
                  <p className="text-xs text-muted">
                    Successfully mapped <span className="text-green-400 font-bold"><CountUp end={result.totalFound} duration={2} /> intelligence units</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleViewResults}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                Launch Intelligence Panel
                <LayoutGrid size={16} />
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 animate-in shake-in duration-500">
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                <div className="flex items-start gap-4 text-red-400">
                  <AlertCircle size={24} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">System Interruption</h3>
                    <p className="text-xs leading-relaxed text-red-200/70">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleScrape}
                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <RefreshCw size={16} />
                Attempt Re-connection
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 flex justify-between items-center bg-white/[0.01] border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest opacity-50">Core.v0.9.1</span>
        </div>
        <div className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
          <a href="#" className="text-white hover:text-accent"><ExternalLink size={12} /></a>
          <a href="#" className="text-white hover:text-accent"><Search size={12} /></a>
        </div>
      </footer>
    </div>
  );
};
