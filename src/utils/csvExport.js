function escapeCsvField(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatHoursCell(hours) {
  if (!hours || Object.keys(hours).length === 0) return "";
  return Object.entries(hours)
    .map(([day, value]) => `${day}: ${value}`)
    .join(" | ");
}

export function storesToCsv(stores, headers) {
  const rows = stores.map((store) => [
    store.name,
    store.address,
    store.city,
    store.country,
    store.phone || "",
    store.email || "",
    store.brands.join("; "),
    formatHoursCell(store.hours),
    store.lat,
    store.lng,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
