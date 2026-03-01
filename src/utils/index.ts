import * as XLSX from "xlsx";
import type { ExportFormat, JobListing } from "../types";

const HEADERS = [
  "Title",
  "Company",
  "Role",
  "Location",
  "Deadline",
  "Salary",
  "Job Type",
  "Platform",
  "URL",
  "Scraped At",
];

function jobToRow(job: JobListing): string[] {
  return [
    job.title,
    job.company,
    job.role,
    job.location,
    job.deadline,
    job.salary,
    job.jobType,
    job.platform,
    job.url,
    job.scrapedAt,
  ];
}

export function exportToCSV(jobs: JobListing[], filename = "ph-jobs"): void {
  const rows = [HEADERS, ...jobs.map(jobToRow)];
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportToExcel(jobs: JobListing[], filename = "ph-jobs"): void {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...jobs.map(jobToRow)]);

  // Style header row
  //   const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  //   ws["!cols"] = HEADERS.map((h, i) => ({
  //     wch: [30, 25, 25, 20, 15, 15, 15, 15, 50, 25][i] || 20,
  //   }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jobs");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportJobs(
  jobs: JobListing[],
  format: ExportFormat,
  filename?: string
): void {
  if (format === "csv") {
    exportToCSV(jobs, filename);
  } else {
    exportToExcel(jobs, filename);
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
