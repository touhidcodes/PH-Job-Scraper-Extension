import type { JobListing, ExportFormat } from "../types";
import * as XLSX from "xlsx";

const COLUMNS = [
  { key: "title", label: "Job Title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "jobType", label: "Job Type" },
  { key: "salary", label: "Salary" },
  { key: "experience", label: "Experience" },
  { key: "deadline", label: "Deadline" },
  { key: "postedDate", label: "Posted Date" },
  { key: "platform", label: "Platform" },
  { key: "url", label: "URL" },
  { key: "scrapedAt", label: "Scraped At" },
] as const;

export const exportJobs = (
  jobs: JobListing[],
  format: ExportFormat,
  filename?: string
): void => {
  const name = filename || `ph-jobs-${new Date().toISOString().split("T")[0]}`;

  const rows = jobs.map((job) =>
    COLUMNS.reduce<Record<string, string>>((acc, col) => {
      acc[col.label] = String(
        (job as unknown as Record<string, unknown>)[col.key] ?? ""
      );
      return acc;
    }, {})
  );

  if (format === "csv") {
    exportCSV(rows, `${name}.csv`);
  } else {
    exportXLSX(rows, `${name}.xlsx`);
  }
};

const exportCSV = (rows: Record<string, string>[], filename: string): void => {
  const headers = Object.keys(rows[0] || {});
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename);
};

const exportXLSX = (rows: Record<string, string>[], filename: string): void => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  // Style headers
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "6C63FF" } },
      alignment: { horizontal: "center" },
    };
  }

  // Auto column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(key.length, ...rows.map((r) => (r[key] ?? "").length)) + 2,
      50
    ),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Jobs");
  XLSX.writeFile(wb, filename);
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
