// Parses an uploaded .xlsx or .csv file into a plain array of row-arrays
// (first row = headers), regardless of source format, so the caller
// (portfolioMatching.js) has a single shape to work with.

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  // French Excel exports commonly use ";" since "," is the decimal separator.
  return semicolonCount > commaCount ? ";" : ",";
}

// Hand-rolled, linear-scan CSV parser (no regex backtracking) that handles
// quoted fields, escaped quotes (""), CRLF/LF, and a leading BOM.
function parseCsv(text) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const delimiter = detectDelimiter(clean);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export async function parseSpreadsheetFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return parseCsv(text);
  }

  // Dynamically imported so the parsing library doesn't bloat the main
  // bundle for visitors who never use the import feature. `readSheet` (not
  // the default export, which returns all sheets wrapped in
  // `{ sheet, data }` objects as of v9) gives row-arrays directly for the
  // first sheet.
  const { readSheet } = await import("read-excel-file/browser");
  const rows = await readSheet(file);
  return rows.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))),
  );
}
