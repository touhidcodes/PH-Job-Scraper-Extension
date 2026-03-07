import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Globe,
  LayoutGrid,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Zap,
} from "lucide-react";

import { useEffect, useState } from "react";
import CountUp from "react-countup";

type Status = "idle" | "scraping" | "success" | "error";
type Theme = "light" | "dark";

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
}

export const Popup = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [theme, setTheme] = useState<Theme>("dark");
  const [currentUrl, setCurrentUrl] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ScrapeProgress>({
    current: 0,
    total: 0,
    title: "",
  });

  /* ---------------------- Lifecycle & Persistence ---------------------- */

  useEffect(() => {
    chrome.storage.local.get(["theme"], (res) => {
      if (res.theme === "light" || res.theme === "dark") {
        setTheme(res.theme as Theme);
      }
    });

    const fetchTab = async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
          setCurrentUrl(tab.url || "");
          const host = tab.url?.toLowerCase() || "";
          const found = ["linkedin.com", "wellfound.com", "bdjobs.com", "indeed.com", "glassdoor.com"].some(p => host.includes(p));
          setPlatformName(found ? "Verified Source" : "Standard Node");
        }
      });
    };

    fetchTab();

    const listener = (msg: any) => {
      if (msg.type === "SCRAPE_PROGRESS") {
        setProgress(msg.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const [platformName, setPlatformName] = useState("Scanning...");

  useEffect(() => {
    chrome.storage.local.set({ theme });
  }, [theme]);

  /* ---------------------- Actions ---------------------- */

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  const handleScrape = async () => {
    if (status === "scraping") return;

    setStatus("scraping");
    setError("");
    setResult(null);
    setProgress({ current: 0, total: 0, title: "" });

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab?.id) throw new Error("Could not find an active window.");

      if (!tab.url?.startsWith("http")) {
        throw new Error("This extension only works on HTTP/HTTPS websites.");
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        await new Promise(r => setTimeout(r, 450));
      } catch (e) {
        console.warn("Script status:", e);
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_JOBS" });

      if (response?.success && response.totalFound > 0) {
        setResult(response);
        setStatus("success");
      } else {
        throw new Error(response?.error || "Zero items matched. Please scroll down to load more jobs and try again.");
      }
    } catch (err: any) {
      console.error("Scrape Error:", err);
      let msg = err.message || "Extraction failed";
      if (msg.includes("Could not establish connection")) {
        msg = "Ready for input. Please refresh the page and try again.";
      }
      setError(msg);
      setStatus("error");
    }
  };

  const handleViewResults = () => {
    if (!result) return;
    chrome.storage.local.set({ scrapeResult: result }, () => {
      chrome.runtime.sendMessage({ type: "OPEN_RESULTS" });
    });
  };

  /* ---------------------- Styles ---------------------- */

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "bg-midnight" : "bg-light-bg",
    text: isDark ? "text-white" : "text-neutral-900",
    card: isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-neutral-200 shadow-sm",
    muted: isDark ? "text-white/40" : "text-neutral-500",
    header: isDark ? "bg-black/20 border-white/5" : "bg-white border-b border-purple-100",
    accent: "text-ph-purple",
    gradient: "ph-gradient"
  };

  return (
    <div className={`w-[380px] h-[600px] ${colors.bg} ${colors.text} flex flex-col font-sans transition-all duration-500 relative overflow-hidden`}>
      {/* Visual Enhancers */}
      <div className={`absolute inset-0 ${isDark ? 'ph-grid' : 'ph-grid-light'} pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-80 h-80 bg-ph-purple/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-60' : 'opacity-20'}`} />
      <div className={`absolute bottom-0 left-0 w-80 h-80 bg-ph-orange/10 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-40' : 'opacity-10'}`} />

      {/* Header */}
      <header className={`relative z-20 px-6 py-5 flex justify-between items-center ${colors.header} backdrop-blur-xl`}>
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl ${colors.gradient} flex items-center justify-center shadow-lg shadow-ph-purple/30 group transition-transform hover:rotate-12`}>
              <Briefcase size={22} className="text-white" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-lg bg-white border-2 ${isDark ? 'border-midnight' : 'border-white'} flex items-center justify-center shadow-md`}>
              <Zap size={10} className="text-ph-purple" fill="currentColor" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-[900] tracking-tight m-0 leading-none bg-gradient-to-r from-ph-purple to-ph-orange bg-clip-text text-transparent italic">
              PH JOB SCRAPER
            </h1>
            <div className="flex items-center gap-2 mt-1.5 ">
              <div className="w-1.5 h-1.5 rounded-full bg-ph-purple animate-pulse" />
              <span className={`text-[9.5px] font-[800] uppercase tracking-[0.15em] opacity-80 ${isDark ? 'text-white' : 'text-neutral-600'}`}>by JP Nexen</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl transition-all duration-500 border flex items-center justify-center group active:scale-90
            ${isDark 
              ? "bg-white/5 border-white/10 text-ph-purple hover:bg-white/10 hover:border-ph-purple/40" 
              : "bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-white hover:border-purple-300 shadow-sm"}`}
        >
          {isDark ? <Sun size={19} className="group-hover:rotate-45 transition-transform" /> : <Moon size={19} className="group-hover:-rotate-12 transition-transform" />}
        </button>
      </header>

      {/* Main Sections */}
      <main className="relative z-10 flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Source Tracker */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className={`text-[10px] font-[900] uppercase tracking-[0.25em] ${colors.muted}`}>Source Intelligence</h2>
            <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border-2 flex items-center gap-2
              ${isDark ? "bg-ph-purple/10 border-ph-purple/30 text-ph-purple" : "bg-white border-purple-200 text-ph-purple shadow-sm"} `}>
                <div className="w-1.5 h-1.5 rounded-full bg-ph-purple shadow-[0_0_8px_#c33def]" />
                {platformName}
            </div>
          </div>
          <div className={`p-4.5 rounded-[22px] border ${colors.card} transition-all duration-700 hover:border-ph-purple/30 group`}>
            <div className="flex items-center gap-3.5 overflow-hidden">
               <Globe size={15} className={`transition-colors duration-500 ${isDark ? 'text-ph-purple' : 'text-purple-600'}`} />
               <p className={`text-[11.5px] font-bold truncate leading-relaxed m-0 ${isDark ? 'text-white/90' : 'text-neutral-800'}`}>
                 {currentUrl || "Awakening system sensors..."}
               </p>
            </div>
          </div>
        </div>

        {/* Center Activity */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {status === "idle" && (
            <div className="space-y-7 animate-in fade-in zoom-in-95 duration-700">
              <button
                onClick={handleScrape}
                className={`w-full relative py-5 rounded-[28px] ${colors.gradient} text-white font-[900] text-xs uppercase tracking-[0.25em] shadow-2xl shadow-ph-purple/40 hover:scale-[1.03] active:scale-95 transition-all duration-500 group overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <Zap size={19} fill="currentColor" className="animate-pulse" />
                  <span>Harvest Job Intel</span>
                </div>
              </button>
              <div className="flex flex-col items-center gap-2">
                <p className={`text-[10px] text-center font-bold px-8 leading-relaxed italic ${colors.muted}`}>
                  Advanced DOM parsing enabled across all major job portals.
                </p>
              </div>
            </div>
          )}

          {status === "scraping" && (
            <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                   <div className={`w-28 h-28 rounded-full border-[7px] ${isDark ? "border-white/5" : "border-neutral-100"} shadow-inner shadow-black/20`} />
                   <div className={`absolute inset-0 w-28 h-28 rounded-full border-[7px] border-transparent border-t-ph-purple border-r-ph-orange animate-spin`} />
                   <div className={`absolute inset-0 flex items-center justify-center font-[900] text-lg tracking-tighter ${isDark ? 'text-white' : 'text-purple-900'}`}>
                     <CountUp end={progress.total > 0 ? (progress.current / progress.total) * 100 : 8} duration={1} />%
                   </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-[900] text-sm bg-gradient-to-r from-ph-purple to-ph-orange bg-clip-text text-transparent uppercase tracking-[0.2em] m-0">Synchronizing Data</p>
                  <p className={`text-[10px] font-mono font-[800] opacity-60 ${colors.text}`}>PROTOCOL ALPHA-9 ACTIVE</p>
                </div>
              </div>

              <div className="space-y-4 px-3">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-ph-purple uppercase tracking-widest">Entry Count</span>
                   <span className={`text-[12px] font-mono font-black ${isDark ? 'text-white' : 'text-black'}`}>
                     <CountUp end={progress.current} duration={0.5} /> / {progress.total || "???"}
                   </span>
                </div>
                <div className={`h-3 w-full ${isDark ? "bg-white/5" : "bg-neutral-200"} rounded-full border-2 ${isDark ? 'border-white/5' : 'border-neutral-100'} overflow-hidden`}>
                  <div 
                    className="h-full ph-gradient rounded-full shadow-[0_0_20px_rgba(195,61,239,0.6)] transition-all duration-1000 ease-out"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 15}%` }}
                  />
                </div>
                {progress.title && (
                   <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${colors.card} animate-in slide-in-from-bottom-2 duration-500`}>
                     <Search size={14} className="text-ph-purple shrink-0 animate-pulse" />
                     <p className={`text-[10px] font-bold truncate italic leading-none m-0 ${colors.muted}`}>
                       Analyzing: {progress.title}
                     </p>
                   </div>
                )}
              </div>
            </div>
          )}

          {status === "success" && result && (
            <div className="space-y-8 animate-in zoom-in-95 duration-700">
              <div className={`p-8 rounded-[38px] ${isDark ? "bg-ph-purple/5 border-ph-purple/20 shadow-purple-950/20" : "bg-purple-50 border-purple-100 shadow-sm"} border-2 flex flex-col items-center text-center gap-5 shadow-2xl`}>
                <div className={`w-18 h-18 rounded-full ${colors.gradient} flex items-center justify-center text-white shadow-xl shadow-ph-purple/30`}>
                  <CheckCircle2 size={38} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h3 className={`font-[900] text-xl tracking-tight m-0 ${isDark ? 'text-white' : 'text-purple-950'}`}>Scan Successful</h3>
                  <p className={`text-[11.5px] font-bold ${colors.muted} leading-relaxed`}>
                    Integrated <span className="text-ph-orange font-black px-1.5 py-0.5 rounded-lg bg-ph-orange/10"><CountUp end={result.totalFound} duration={2} /></span> unique opportunities into the database.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleViewResults}
                className={`w-full py-4.5 rounded-[22px] ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-neutral-900 hover:bg-black"} text-white font-[900] text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 group`}
              >
                Open Analytics Panel
                <LayoutGrid size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-8 animate-in shake-in duration-500">
              <div className={`p-7 rounded-[28px] ${isDark ? "bg-red-500/5 border-red-500/20 shadow-red-950/20" : "bg-red-50 border-red-100 shadow-sm"} border-2 space-y-4`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-black uppercase text-red-500 tracking-[0.2em] m-0">Link Fault</h3>
                    <p className={`text-[11.5px] font-bold leading-relaxed ${isDark ? "text-red-200/70" : "text-red-800"}`}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleScrape}
                className={`w-full py-4.5 rounded-[22px] bg-red-500/10 border-2 border-red-500/30 text-red-500 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all active:scale-95 shadow-xl shadow-red-500/10`}
              >
                <RefreshCw size={17} />
                Reconnect Signal
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Interface */}
      <footer className={`relative z-20 px-7 py-5 flex justify-between items-center ${isDark ? "bg-black/30 border-t border-white/5" : "bg-neutral-50 border-t border-neutral-100"}`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-ph-purple animate-pulse shadow-[0_0_10px_#c33def]" />
          <span className={`text-[10px] font-mono font-black uppercase tracking-[0.3em] opacity-30 ${colors.text}`}>SYSTEM_V1.5.8</span>
        </div>
        <div className={`flex items-center gap-5 ${colors.muted} opacity-60`}>
          <Search size={16} className="hover:text-ph-purple cursor-pointer transition-all hover:scale-110" />
          <ExternalLink size={16} className="hover:text-ph-purple cursor-pointer transition-all hover:scale-110" />
        </div>
      </footer>
    </div>
  );
};
