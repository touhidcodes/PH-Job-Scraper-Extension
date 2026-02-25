import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
export function exportCSV(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    saveAs(new Blob([csv]), "jobs.csv");
}
export function exportXLS(data) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Jobs");
    XLSX.writeFile(wb, "jobs.xlsx");
}
