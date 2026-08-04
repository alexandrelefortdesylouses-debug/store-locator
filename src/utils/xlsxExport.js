import writeExcelFile from "write-excel-file/browser";

const HEADER_BG = "#0F172A";
const HEADER_TEXT = "#FFFFFF";
const BORDER_COLOR = "#E2E8F0";
const ZEBRA_BG = "#F8FAFC";
const HEADER_ROW_HEIGHT = 22; // points (~28-29px)

const POSTAL_CODE_REGEX = /\b(\d{5})\b/;
const CENTERED_KEYS = new Set(["postalCode", "phone", "lat", "lng"]);
const TEXT_FORMAT_KEYS = new Set(["postalCode", "phone"]);
const NUMERIC_KEYS = new Set(["lat", "lng"]);

function extractPostalCode(address) {
  const match = address.match(POSTAL_CODE_REGEX);
  return match ? match[1] : "";
}

function formatHoursCell(hours) {
  if (!hours || Object.keys(hours).length === 0) return "";
  return Object.entries(hours)
    .map(([day, value]) => `${day}: ${value}`)
    .join(" | ");
}

function buildColumns(labels) {
  return [
    { key: "name", label: labels.name },
    { key: "address", label: labels.address },
    { key: "city", label: labels.city },
    { key: "postalCode", label: labels.postalCode },
    { key: "country", label: labels.country },
    { key: "phone", label: labels.phone },
    { key: "email", label: labels.email },
    { key: "brands", label: labels.brands },
    { key: "hours", label: labels.hours },
    { key: "lat", label: labels.latitude },
    { key: "lng", label: labels.longitude },
  ];
}

function cellValue(store, key) {
  switch (key) {
    case "name":
      return store.name;
    case "address":
      return store.address;
    case "city":
      return store.city;
    case "postalCode":
      return extractPostalCode(store.address);
    case "country":
      return store.country;
    case "phone":
      return store.phone || "";
    case "email":
      return store.email || "";
    case "brands":
      return store.brands.join(", ");
    case "hours":
      return formatHoursCell(store.hours);
    case "lat":
      return store.lat;
    case "lng":
      return store.lng;
    default:
      return "";
  }
}

export async function exportStoresToXlsx(stores, labels, filename) {
  const columns = buildColumns(labels);

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

  const dataRows = stores.map((store, rowIndex) => {
    const zebra = rowIndex % 2 === 1;
    return columns.map((col) => {
      const raw = cellValue(store, col.key);
      const numeric = NUMERIC_KEYS.has(col.key);

      const cell = {
        value: numeric ? raw : String(raw ?? ""),
        type: numeric ? Number : String,
        align: CENTERED_KEYS.has(col.key) ? "center" : "left",
        alignVertical: "center",
        borderColor: BORDER_COLOR,
        borderStyle: "thin",
      };

      if (TEXT_FORMAT_KEYS.has(col.key)) {
        cell.format = "@";
      }
      if (zebra) {
        cell.backgroundColor = ZEBRA_BG;
      }

      return cell;
    });
  });

  const columnWidths = columns.map((col) => {
    let maxLen = col.label.length;
    stores.forEach((store) => {
      const value = cellValue(store, col.key);
      maxLen = Math.max(maxLen, String(value ?? "").length);
    });
    return { width: Math.min(Math.max(maxLen + 2, 8), 60) };
  });

  await writeExcelFile([headerRow, ...dataRows], {
    sheet: labels.sheetName || "Opticiens",
    columns: columnWidths,
    stickyRowsCount: 1,
  }).toFile(filename);
}
