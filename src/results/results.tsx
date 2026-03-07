import {
    Briefcase,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Clock,
    Download,
    ExternalLink,
    Filter,
    Globe,
    LayoutGrid,
    MapPin,
    Search,
    Table2,
    X,
    Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import type { ExportFormat, JobListing, ScrapeResult } from "../types";
import { exportJobs } from "../utils";

type SortKey = keyof JobListing;
type SortDir = "asc" | "desc";

const COLUMNS: { key: keyof JobListing; label: string; width: string }[] = [
  { key: "title", label: "Opportunity", width: "w-64" },
  { key: "company", label: "Company", width: "w-44" },
  { key: "location", label: "Location", width: "w-36" },
  { key: "jobType", label: "Type", width: "w-28" },
  { key: "salary", label: "Compensation", width: "w-32" },
  { key: "deadline", label: "Deadline", width: "w-32" },
  { key: "platform", label: "Source", width: "w-28" },
];

export const Results = () => {
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterPlatform, setFilterPlatform] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("scrapeResult", (data) => {
      if (data.scrapeResult) {
        const r = data.scrapeResult as ScrapeResult;
        setResult(r);
        setSelectedIds(new Set(r.jobs.map((j) => j.id)));
      }
    });
  }, []);

  const filteredJobs = useMemo(() => {
    if (!result) return [];
    return result.jobs
      .filter((job) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q);
        const matchPlatform =
          filterPlatform === "All" || job.platform === filterPlatform;
        const matchType = filterType === "All" || job.jobType === filterType;
        return matchSearch && matchPlatform && matchType;
      })
      .sort((a, b) => {
        const av = String((a as any)[sortKey] ?? "");
        const bv = String((b as any)[sortKey] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [result, search, filterPlatform, filterType, sortKey, sortDir]);

  const selectedJobs = useMemo(
    () => filteredJobs.filter((j) => selectedIds.has(j.id)),
    [filteredJobs, selectedIds]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    if (selectedJobs.length === 0) return;
    exportJobs(selectedJobs, exportFormat);
  };

  if (!result) return <LoadingPlaceholder />;

  return (
    <div className="min-h-screen bg-midnight text-white selection:bg-ph-purple selection:text-white relative overflow-hidden flex flex-col font-sans">
      {/* Visual Identity */}
      <div className="fixed inset-0 ph-grid pointer-events-none opacity-40" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ph-purple/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-ph-orange/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Shell */}
      <header className="relative z-50 border-b border-white/5 bg-obsidian/40 backdrop-blur-2xl px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">
          
          {/* Brand & Stats */}
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-[18px] ph-gradient flex items-center justify-center shadow-lg shadow-ph-purple/20 group-hover:rotate-6 transition-transform">
                 <Briefcase size={22} className="text-white" />
               </div>
               <div>
                 <h1 className="text-lg font-[900] tracking-tighter m-0 bg-gradient-to-r from-ph-purple to-ph-orange bg-clip-text text-transparent italic leading-tight">
                   PH ANALYTICS
                 </h1>
                 <p className="text-[10px] font-mono font-[800] tracking-[0.3em] opacity-40 uppercase">Extraction Feed</p>
               </div>
             </div>

             <div className="hidden lg:flex items-center h-8 w-[1px] bg-white/5 mx-2" />

             <div className="hidden lg:flex items-center gap-4">
                <StatCard label="Total Harvest" value={result.totalFound} accent="ph-purple" />
                <StatCard label="Selected" value={selectedIds.size} accent="ph-orange" />
             </div>
          </div>

          {/* Search & Global Actions */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-ph-purple transition-colors" />
              <input 
                type="text"
                placeholder="Search candidates, titles, or locations..."
                className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 text-[13px] font-bold focus:outline-none focus:border-ph-purple/50 bg-obsidian transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <X size={14} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer opacity-40 hover:opacity-100" onClick={() => setSearch("")} />}
            </div>
          </div>

          {/* Tooling Bar */}
          <div className="flex items-center gap-3">
             <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <ViewButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={<Table2 size={16}/>} />
                <ViewButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')} icon={<LayoutGrid size={16}/>} />
             </div>

             <div className="flex h-8 w-[1px] bg-white/5 mx-1" />

             <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <ExportFormatButton active={exportFormat === 'excel'} onClick={() => setExportFormat('excel')} label="XLSX" />
                <ExportFormatButton active={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} label="CSV" />
             </div>

             <button
               disabled={selectedJobs.length === 0}
               onClick={handleExport}
               className={`h-11 px-6 rounded-2xl ph-gradient text-white font-[900] text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-3 shadow-ph-purple/20`}
             >
               <Download size={16} />
               <span className="hidden sm:inline">Export Secured Data</span>
               {selectedIds.size > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{selectedIds.size}</span>}
             </button>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Local Title & Filter Trigger */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-[22px] backdrop-blur-md">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-ph-purple/10 rounded-xl text-ph-purple">
                  <Globe size={18}/>
               </div>
               <div>
                  <h2 className="text-sm font-black m-0 tracking-tight">System Feed: {result.platform}</h2>
                  <p className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-widest">Active session linked to {new Date(result.scrapedAt).toDateString()}</p>
               </div>
             </div>
             
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-black uppercase tracking-wider
               ${showFilters ? 'bg-ph-purple border-ph-purple text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
             >
               <Filter size={14}/>
               Advanced Filters
             </button>
          </div>

          {showFilters && <FilterTray visible={showFilters} result={result} search={search} setSearch={setSearch} filterPlatform={filterPlatform} setFilterPlatform={setFilterPlatform} filterType={filterType} setFilterType={setFilterType} />}

          {/* Results Render */}
          {filteredJobs.length === 0 ? (
            <EmptyView />
          ) : viewMode === "table" ? (
             <TableView filteredJobs={filteredJobs} selectedIds={selectedIds} setSelectedIds={setSelectedIds} sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
          ) : (
             <GridView filteredJobs={filteredJobs} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-20 px-8 py-5 border-t border-white/5 bg-black/40 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-ph-orange animate-pulse shadow-[0_0_10px_#ff930f]" />
          <span className="text-[10px] font-mono font-black opacity-30 tracking-[0.4em]">SYSTEM_STABLE // JUNCTION_NODE_6</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black italic opacity-40 uppercase mr-2">Proprietary logic by</span>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
             <h4 className="text-[10px] font-[900] bg-gradient-to-r from-ph-purple to-ph-orange bg-clip-text text-transparent m-0 italic">JP NEXEN INTELLIGENCE</h4>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── Component Primitives ───────────────────────────────────────────────────

const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-0.5">
    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
    <span className={`text-[17px] font-[900] text-${accent}`}>
      <CountUp end={value} duration={1.5} />
    </span>
  </div>
);

const ViewButton = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-all ${active ? 'bg-ph-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
  >
    {icon}
  </button>
);

const ExportFormatButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 text-[10px] font-black transition-all rounded-lg ${active ? 'bg-ph-orange text-white shadow-lg shadow-ph-orange/20' : 'text-white/40 hover:text-white'}`}
  >
    {label}
  </button>
);

const LoadingPlaceholder = () => (
  <div className="min-h-screen bg-midnight ph-grid flex flex-col items-center justify-center gap-6">
    <div className="relative">
      <div className="w-20 h-20 rounded-3xl ph-gradient animate-pulse rotate-12 flex items-center justify-center">
        <Zap size={32} className="text-white fill-white" />
      </div>
      <div className="absolute inset-0 w-20 h-20 rounded-3xl ph-gradient blur-xl opacity-30 animate-pulse" />
    </div>
    <div className="text-center">
       <h2 className="text-xl font-black italic ph-purple tracking-tight m-0">Synchronizing Analytics</h2>
       <p className="text-[10px] font-mono font-bold opacity-30 tracking-widest uppercase mt-2">Connecting to secure storage node...</p>
    </div>
  </div>
);

const FilterTray = ({ result, filterPlatform, setFilterPlatform, filterType, setFilterType }: any) => {
  const platforms = useMemo(() => ["All", ...Array.from(new Set(result.jobs.map((j: any) => j.platform)))], [result]);
  const types = useMemo(() => ["All", ...Array.from(new Set(result.jobs.map((j: any) => j.jobType)))].filter(Boolean), [result]);

  return (
    <div className="flex flex-wrap gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-[32px] animate-in slide-in-from-top-4 duration-500">
       <div className="space-y-2">
         <label className="text-[10px] uppercase font-black opacity-30 tracking-widest px-2">Source Origin</label>
         <div className="flex gap-2">
           {platforms.map((p: any) => (
             <button 
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${filterPlatform === p ? 'bg-ph-purple/20 border-ph-purple text-ph-purple' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
             >
               {p}
             </button>
           ))}
         </div>
       </div>

       <div className="w-[1px] bg-white/5 h-12 self-end mx-2" />

       <div className="space-y-2">
         <label className="text-[10px] uppercase font-black opacity-30 tracking-widest px-2">Contract Nature</label>
         <div className="flex gap-2">
           {types.map((t: any) => (
             <button 
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${filterType === t ? 'bg-ph-orange/20 border-ph-orange text-ph-orange' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
             >
               {t}
             </button>
           ))}
         </div>
       </div>
    </div>
  );
};

const TableView = ({ filteredJobs, selectedIds, setSelectedIds, sortKey, sortDir, toggleSort }: any) => {
  const toggleJob = (id: string) => {
    setSelectedIds((prev: any) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-[32px] border border-white/5 bg-white/[0.01] overflow-hidden backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/[0.03] border-b border-white/5">
            <th className="p-5 w-16">
               <div 
                 onClick={() => setSelectedIds(selectedIds.size === filteredJobs.length ? new Set() : new Set(filteredJobs.map((j:any)=>j.id)))}
                 className={`w-5 h-5 rounded-md border-2 transition-all cursor-pointer flex items-center justify-center ${selectedIds.size === filteredJobs.length ? 'bg-ph-purple border-ph-purple' : 'border-white/10 hover:border-white/30'}`}
               >
                 {selectedIds.size === filteredJobs.length && <CheckSquare size={12}/>}
               </div>
            </th>
            {COLUMNS.map(col => (
              <th 
                key={col.key} 
                className={`p-5 text-[10px] font-black uppercase tracking-widest text-white/30 cursor-pointer hover:text-white transition-colors ${col.width}`}
                onClick={() => toggleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                   {col.label}
                   {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} className="text-ph-purple"/> : <ChevronDown size={12} className="text-ph-purple"/>)}
                </div>
              </th>
            ))}
            <th className="p-5 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {filteredJobs.map((job: any) => (
            <tr 
              key={job.id} 
              className={`group transition-colors ${selectedIds.has(job.id) ? 'bg-ph-purple/5' : 'hover:bg-white/[0.02]'}`}
              onClick={() => toggleJob(job.id)}
            >
              <td className="p-5">
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.has(job.id) ? 'bg-ph-purple border-ph-purple' : 'border-white/10 group-hover:border-white/20'}`}>
                   {selectedIds.has(job.id) && <CheckSquare size={12}/>}
                </div>
              </td>
              <td className="p-5">
                <p className="font-bold text-[13px] m-0 line-clamp-1 group-hover:text-ph-purple transition-colors">{job.title}</p>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full ph-gradient" />
                  <span className="text-[12px] font-bold opacity-60 m-0">{job.company}</span>
                </div>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2 text-white/40">
                  <MapPin size={12}/>
                  <span className="text-[11px] font-bold truncate max-w-[120px]">{job.location}</span>
                </div>
              </td>
              <td className="p-5">
                {job.jobType && <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-ph-orange">{job.jobType}</span>}
              </td>
              <td className="p-5">
                <span className="font-mono text-[11px] font-black text-ph-purple">{job.salary || '—'}</span>
              </td>
              <td className="p-5">
                <span className="text-[11px] font-bold opacity-40">{job.deadline || 'Ongoing'}</span>
              </td>
              <td className="p-5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/5 opacity-50">{job.platform}</span>
              </td>
              <td className="p-5">
                 <a 
                   href={job.url} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:ph-gradient transition-all"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <ExternalLink size={14}/>
                 </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GridView = ({ filteredJobs, selectedIds, setSelectedIds }: any) => {
  const toggleJob = (id: string) => {
    setSelectedIds((prev: any) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {filteredJobs.map((job: any) => {
        const selected = selectedIds.has(job.id);
        return (
          <div 
            key={job.id}
            onClick={() => toggleJob(job.id)}
            className={`relative p-6 rounded-[32px] border transition-all duration-300 group cursor-pointer
            ${selected ? 'bg-ph-purple/10 border-ph-purple/40 shadow-xl shadow-ph-purple/5' : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'}`}
          >
             <div className="absolute top-4 right-4 z-20">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'bg-ph-purple border-ph-purple' : 'border-white/10 group-hover:border-white/20'}`}>
                  {selected && <CheckSquare size={14}/>}
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-black opacity-40 uppercase tracking-widest">{job.platform}</div>
                </div>

                <div>
                   <h3 className="text-base font-black tracking-tight leading-snug m-0 group-hover:text-ph-purple transition-colors line-clamp-2">
                     {job.title}
                   </h3>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full ph-gradient" />
                      <p className="text-[12px] font-bold opacity-60 m-0">{job.company}</p>
                   </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                   <div className="flex items-center gap-2 text-white/40">
                      <MapPin size={13}/>
                      <span className="text-[11px] font-bold">{job.location}</span>
                   </div>
                   <div className="flex items-center gap-2 text-white/40">
                      <Clock size={13}/>
                      <span className="text-[11px] font-bold">{job.deadline || 'Submission Pending'}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                   <div className="flex items-center gap-2">
                      {job.jobType && <span className="px-2 py-0.5 rounded-lg bg-ph-orange/10 border border-ph-orange/20 text-ph-orange text-[10px] font-black">{job.jobType}</span>}
                      {job.salary && <span className="text-ph-purple font-mono text-[11px] font-black">{job.salary}</span>}
                   </div>
                   <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                   >
                     <ExternalLink size={16} className="text-white/20 hover:text-white transition-colors" />
                   </a>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

const EmptyView = () => (
  <div className="py-24 flex flex-col items-center justify-center text-center">
    <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
       <Zap size={40} className="text-white/10" />
    </div>
    <h3 className="text-2xl font-black italic m-0">No Intel Matched</h3>
    <p className="text-sm font-bold opacity-30 mt-2 max-w-sm mx-auto leading-relaxed">System sensors couldn't find any listings matching your current filter set. Try broadening your signal parameters.</p>
  </div>
);
