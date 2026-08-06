import writeExcelFile from "write-excel-file/browser";
import { getStoreZip } from "./postalCode";

const HEADER_BG = "#0F172A";
const HEADER_TEXT = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";
const ZEBRA_BG = "#F8FAFC";
const HEADER_ROW_HEIGHT = 22;

function metaRow(text, bold = false) {
  return [{ value: text, type: String, fontWeight: bold ? "bold" : "normal" }];
}

// Same table shape as utils/xlsxExport.js's general "export selection" but
// scoped to Mon Carnet's folder columns (statut instead of raw hours/lat/
// lng/website) and prefixed with a metadata block — folder name, notes,
// and key indicators — since a folder export is a small report, not just a
// raw data dump.
export async function exportFolderToXlsx({ title, notes, entries, statuses, labels }) {
  const columns = [
    { key: "name", label: labels.colName },
    { key: "city", label: labels.colCity },
    { key: "postalCode", label: labels.colPostal },
    { key: "brands", label: labels.colBrands },
    { key: "status", label: labels.colStatus },
    { key: "phone", label: labels.colPhone },
  ];

  const metaRows = [metaRow(title, true), metaRow(`${labels.dateLabel} : ${labels.dateValue}`)];
  if (notes?.trim()) {
    metaRows.push(metaRow(labels.notesTitle, true));
    notes
      .trim()
      .split("\n")
      .forEach((line) => metaRows.push(metaRow(line)));
  }
  metaRows.push(metaRow(""));
  metaRows.push(metaRow(labels.kpiTitle, true));
  labels.kpiRows.forEach(({ label, value }) => metaRows.push(metaRow(`${label} : ${value}`)));
  metaRows.push(metaRow(""));

  const headerRow = columns.map((col) => ({
    value: col.label,
    type: String,
    fontWeight: "bold",
    backgroundColor: HEADER_BG,
    textColor: HEADER_TEXT,
    align: "center",
    alignVertical: "center",
    height: HEADER_ROW_HEIGHT,
    borderColor: BORDER_COLOR,
    borderStyle: "thin",
  }));

  const dataRows = entries.map((store, rowIndex) => {
    const zebra = rowIndex % 2 === 1;
    const status = statuses[store.id];
    const values = {
      name: store.name,
      city: store.city,
      postalCode: getStoreZip(store) || "",
      brands: store.brands.join(", "),
      status: status ? labels.statusLabels[status] || status : labels.statusNone,
      phone: store.phone || "",
    };
    return columns.map((col) => {
      const cell = {
        value: String(values[col.key] ?? ""),
        type: String,
        align: col.key === "postalCode" || col.key === "phone" ? "center" : "left",
        alignVertical: "center",
        borderColor: BORDER_COLOR,
        borderStyle: "thin",
      };
      if (col.key === "postalCode" || col.key === "phone") cell.format = "@";
      if (zebra) cell.backgroundColor = ZEBRA_BG;
      return cell;
    });
  });

  const columnWidths = columns.map((col) => {
    let maxLen = col.label.length;
    entries.forEach((store) => {
      const status = statuses[store.id];
      const values = {
        name: store.name,
        city: store.city,
        postalCode: getStoreZip(store) || "",
        brands: store.brands.join(", "),
        status: status ? labels.statusLabels[status] || status : labels.statusNone,
        phone: store.phone || "",
      };
      maxLen = Math.max(maxLen, String(values[col.key] ?? "").length);
    });
    return { width: Math.min(Math.max(maxLen + 2, 8), 60) };
  });

  await writeExcelFile([...metaRows, headerRow, ...dataRows], {
    sheet: labels.sheetName,
    columns: columnWidths,
    stickyRowsCount: metaRows.length + 1,
  }).toFile(labels.filename);
}
