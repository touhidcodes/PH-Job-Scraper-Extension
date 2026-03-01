import { useState, useEffect, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Search,
  Filter,
  Briefcase,
  MapPin,
  Building2,
  Clock,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  X,
  LayoutGrid,
  Table2,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import type { JobListing, ExportFormat, ScrapeResult } from "../types";
import { exportJobs } from "../utils";

type SortKey = keyof JobListing;
type SortDir = "asc" | "desc";

const COLUMNS: { key: keyof JobListing; label: string; width: string }[] = [
  { key: "title", label: "Job Title", width: "w-64" },
  { key: "company", label: "Company", width: "w-44" },
  { key: "location", label: "Location", width: "w-36" },
  { key: "jobType", label: "Type", width: "w-28" },
  { key: "salary", label: "Salary", width: "w-32" },
  { key: "deadline", label: "Deadline", width: "w-32" },
  { key: "platform", label: "Platform", width: "w-28" },
];

const TAG_COLORS: Record<string, string> = {
  LinkedIn: "#0A66C2",
  Wellfound: "#ff4d00",
  BDJobs: "#e91e63",
  Indeed: "#003a9b",
  Glassdoor: "#0caa41",
};

const getTagColor = (platform: string) => TAG_COLORS[platform] ?? "#6c63ff";

export const Results = () => {
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterPlatform, setFilterPlatform] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
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

  const platforms = useMemo(() => {
    if (!result) return [];
    return ["All", ...Array.from(new Set(result.jobs.map((j) => j.platform)))];
  }, [result]);

  const jobTypes = useMemo(() => {
    if (!result) return [];
    const types = result.jobs.map((j) => j.jobType).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(types))];
  }, [result]);

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
        const av = String(
          (a as unknown as Record<string, unknown>)[sortKey] ?? ""
        );
        const bv = String(
          (b as unknown as Record<string, unknown>)[sortKey] ?? ""
        );
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

  const toggleAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  const toggleJob = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    if (selectedJobs.length === 0) return;
    exportJobs(selectedJobs, exportFormat);
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-obsidian grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-accent animate-pulse" />
          </div>
          <p className="font-display text-text text-lg font-semibold">
            Loading results...
          </p>
          <p className="font-mono text-muted text-sm mt-1">
            Fetching scraped data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian grid-bg text-text">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-obsidian/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-bright flex items-center justify-center glow-accent flex-shrink-0">
              <Briefcase size={17} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[15px] leading-none">
                PH Job Scraper
              </h1>
              <p className="font-mono text-[10px] text-neon tracking-widest mt-0.5">
                RESULTS
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-3">
            <StatBadge label="Total" value={result.count} color="accent" />
            <StatBadge
              label="Filtered"
              value={filteredJobs.length}
              color="text-dim"
            />
            <StatBadge label="Selected" value={selectedIds.size} color="neon" />
          </div>

          {/* Source info */}
          <div className="flex-1 min-w-0 mx-4">
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
              <span className="truncate">{result.url}</span>
              <span className="text-border">·</span>
              <span className="whitespace-nowrap">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`p-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "bg-surface border-border text-muted hover:text-text"
              }`}
            >
              <SlidersHorizontal size={15} />
            </button>

            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 transition-colors ${
                  viewMode === "table"
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-text"
                }`}
              >
                <Table2 size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-text"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {/* Export format toggle */}
            <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
              {(["xlsx", "csv"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-3 py-2 text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                    exportFormat === fmt
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {fmt === "xlsx" ? (
                    <FileSpreadsheet size={13} />
                  ) : (
                    <FileText size={13} />
                  )}
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={selectedJobs.length === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-display font-semibold text-[13px]
                transition-all duration-200
                ${
                  selectedJobs.length > 0
                    ? "bg-gradient-to-r from-accent to-accent-bright text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98]"
                    : "bg-surface border border-border text-muted cursor-not-allowed"
                }
              `}
            >
              <Download size={14} />
              Export {selectedJobs.length > 0 ? `(${selectedJobs.length})` : ""}
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <div className="border-t border-border bg-surface/50 px-6 py-3 flex items-center gap-4 animate-slide-up">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search jobs, companies, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-obsidian border border-border rounded-xl text-[12px] font-mono text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Platform filter */}
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-muted" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bg-obsidian border border-border rounded-xl px-3 py-2 text-[12px] font-mono text-text focus:outline-none focus:border-accent"
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            {jobTypes.length > 1 && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-obsidian border border-border rounded-xl px-3 py-2 text-[12px] font-mono text-text focus:outline-none focus:border-accent"
              >
                {jobTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <span className="text-[11px] font-mono text-muted ml-auto">
              {filteredJobs.length} results
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {filteredJobs.length === 0 ? (
          <EmptyState hasSearch={!!search} />
        ) : viewMode === "table" ? (
          <TableView
            jobs={filteredJobs}
            selectedIds={selectedIds}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleAll={toggleAll}
            onToggleJob={toggleJob}
            onSort={toggleSort}
          />
        ) : (
          <GridView
            jobs={filteredJobs}
            selectedIds={selectedIds}
            onToggleJob={toggleJob}
          />
        )}
      </main>
    </div>
  );
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const StatBadge = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border`}
  >
    <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
      {label}
    </span>
    <span className={`font-display font-bold text-[14px] text-${color}`}>
      {value}
    </span>
  </div>
);

const TableView = ({
  jobs,
  selectedIds,
  sortKey,
  sortDir,
  onToggleAll,
  onToggleJob,
  onSort,
}: {
  jobs: JobListing[];
  selectedIds: Set<string>;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleAll: () => void;
  onToggleJob: (id: string) => void;
  onSort: (key: SortKey) => void;
}) => {
  const allSelected = selectedIds.size === jobs.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="w-12 p-4">
              <button
                onClick={onToggleAll}
                className="text-muted hover:text-accent transition-colors"
              >
                {allSelected ? (
                  <CheckSquare size={15} className="text-accent" />
                ) : someSelected ? (
                  <div className="w-[15px] h-[15px] border-2 border-accent rounded-sm flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-accent" />
                  </div>
                ) : (
                  <Square size={15} />
                )}
              </button>
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`p-4 text-left font-display font-semibold text-[11px] text-muted uppercase tracking-widest cursor-pointer hover:text-text transition-colors select-none ${col.width}`}
                onClick={() => onSort(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {sortKey === col.key ? (
                    sortDir === "asc" ? (
                      <ChevronUp size={11} className="text-accent" />
                    ) : (
                      <ChevronDown size={11} className="text-accent" />
                    )
                  ) : (
                    <ChevronUp
                      size={11}
                      className="opacity-0 group-hover:opacity-50"
                    />
                  )}
                </div>
              </th>
            ))}
            <th className="w-10 p-4" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => {
            const isSelected = selectedIds.has(job.id);
            return (
              <tr
                key={job.id}
                onClick={() => onToggleJob(job.id)}
                className={`
                  border-b border-border last:border-0 cursor-pointer transition-all duration-150
                  ${
                    isSelected
                      ? "bg-accent/5 border-l-2 border-l-accent"
                      : "hover:bg-surface/60"
                  }
                  ${i % 2 === 0 && !isSelected ? "bg-obsidian" : ""}
                `}
              >
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleJob(job.id)}
                    className="text-muted hover:text-accent transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare size={15} className="text-accent" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <span className="font-display font-semibold text-text text-[13px] line-clamp-1">
                    {job.title}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-text-dim line-clamp-1">
                    {job.company}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-text-dim">
                    <MapPin size={11} className="flex-shrink-0 text-muted" />
                    <span className="line-clamp-1">{job.location}</span>
                  </div>
                </td>
                <td className="p-4">
                  {job.jobType && (
                    <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-mono">
                      {job.jobType}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {job.salary && (
                    <span className="text-neon text-[11px] font-mono">
                      {job.salary}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {job.deadline && (
                    <div className="flex items-center gap-1 text-warning text-[11px] font-mono">
                      <Clock size={11} />
                      {job.deadline}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono"
                    style={{
                      backgroundColor: `${getTagColor(job.platform)}15`,
                      color: getTagColor(job.platform),
                      border: `1px solid ${getTagColor(job.platform)}30`,
                    }}
                  >
                    {job.platform}
                  </span>
                </td>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:text-accent transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const GridView = ({
  jobs,
  selectedIds,
  onToggleJob,
}: {
  jobs: JobListing[];
  selectedIds: Set<string>;
  onToggleJob: (id: string) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {jobs.map((job) => {
      const isSelected = selectedIds.has(job.id);
      const color = getTagColor(job.platform);
      return (
        <div
          key={job.id}
          onClick={() => onToggleJob(job.id)}
          className={`
            relative p-4 rounded-2xl border cursor-pointer transition-all duration-200
            ${
              isSelected
                ? "bg-accent/5 border-accent/40 shadow-lg shadow-accent/10"
                : "bg-surface border-border hover:border-border/80 hover:bg-card"
            }
          `}
        >
          {/* Selection indicator */}
          <div className="absolute top-3 right-3">
            {isSelected ? (
              <CheckSquare size={15} className="text-accent" />
            ) : (
              <Square size={15} className="text-muted" />
            )}
          </div>

          {/* Platform badge */}
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono mb-3"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            {job.platform}
          </span>

          <h3 className="font-display font-semibold text-text text-[13px] leading-snug mb-2 pr-6 line-clamp-2">
            {job.title}
          </h3>

          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Building2 size={11} className="text-muted flex-shrink-0" />
            <span className="line-clamp-1">{job.company}</span>
          </div>

          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-2">
            <MapPin size={11} className="text-muted flex-shrink-0" />
            <span className="line-clamp-1">{job.location}</span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {job.jobType && (
                <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono">
                  {job.jobType}
                </span>
              )}
              {job.salary && (
                <span className="text-neon text-[10px] font-mono">
                  {job.salary}
                </span>
              )}
            </div>
            {job.deadline && (
              <div className="flex items-center gap-1 text-warning text-[10px] font-mono">
                <Clock size={10} />
                {job.deadline}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
      <Search size={24} className="text-muted" />
    </div>
    <p className="font-display font-semibold text-text text-lg">
      {hasSearch ? "No matching jobs" : "No jobs found"}
    </p>
    <p className="font-mono text-muted text-sm mt-1 max-w-xs">
      {hasSearch
        ? "Try adjusting your search or filter criteria"
        : "Go back to a job listing page and try extracting again"}
    </p>
  </div>
);

const getTagColor = (platform: string): string => {
  const colors: Record<string, string> = {
    LinkedIn: "#0A66C2",
    Wellfound: "#ff4d00",
    BDJobs: "#e91e63",
    Indeed: "#003a9b",
    Glassdoor: "#0caa41",
  };
  return colors[platform] ?? "#6c63ff";
};
