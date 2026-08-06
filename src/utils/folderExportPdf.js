import { GOLD_ACCENT, INK, STATUS_COLORS } from "./palette";
import { getStoreZip } from "./postalCode";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CARD_PADDING = 5;

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

const INK_RGB = hexToRgb(INK);
const GOLD_RGB = hexToRgb(GOLD_ACCENT);
const GRAY_RGB = [110, 108, 102];
const LIGHT_GRAY_RGB = [214, 210, 200];
const CARD_BG_RGB = [250, 248, 244];

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

// Measures an optician card's height before drawing it, so the caller can
// decide up front whether it fits on the current page or needs a fresh one
// — jsPDF has no layout engine, so this has to be done by hand (same
// technique as utils/endOfDayReportPdf.js).
function measureCard(doc, store, labels) {
  const textWidth = CONTENT_WIDTH - CARD_PADDING * 2;
  let height = CARD_PADDING + 5.5; // name line
  height += 4.5; // city/zip line

  doc.setFontSize(8.5);
  const brandsText = store.brands.join(", ");
  if (brandsText) {
    height += doc.splitTextToSize(`${labels.brandsLabel} : ${brandsText}`, textWidth).length * 4;
  }
  if (store.phone) {
    height += 4;
  }
  height += CARD_PADDING;
  return height;
}

function drawCard(doc, store, y, labels, statuses) {
  const height = measureCard(doc, store, labels);
  const x = MARGIN;

  doc.setFillColor(...CARD_BG_RGB);
  doc.setDrawColor(...LIGHT_GRAY_RGB);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, CONTENT_WIDTH, height, 2, 2, "FD");

  let cursorY = y + CARD_PADDING + 3;
  const textX = x + CARD_PADDING;
  const textWidth = CONTENT_WIDTH - CARD_PADDING * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK_RGB);
  doc.text(store.name, textX, cursorY);

  const status = statuses[store.id];
  if (status) {
    const statusColor = hexToRgb(STATUS_COLORS[status] || GOLD_ACCENT);
    const label = labels.statusLabels[status] || status;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const labelWidth = doc.getTextWidth(label);
    const dotX = x + CONTENT_WIDTH - CARD_PADDING - labelWidth - 4;
    doc.setFillColor(...statusColor);
    doc.circle(dotX, cursorY - 1.2, 1.3, "F");
    doc.setTextColor(...GRAY_RGB);
    doc.text(label, dotX + 3, cursorY);
  }
  cursorY += 5.5;

  const zip = getStoreZip(store);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`${store.city}${zip ? ` (${zip})` : ""}`, textX, cursorY);
  cursorY += 4.5;

  const brandsText = store.brands.join(", ");
  if (brandsText) {
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY_RGB);
    const brandLines = doc.splitTextToSize(`${labels.brandsLabel} : ${brandsText}`, textWidth);
    brandLines.forEach((line) => {
      doc.text(line, textX, cursorY);
      cursorY += 4;
    });
  }

  if (store.phone) {
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY_RGB);
    doc.text(`${labels.phoneLabel} : ${store.phone}`, textX, cursorY);
    cursorY += 4;
  }

  return y + height;
}

export async function exportFolderToPdf({ title, notes, entries, statuses, labels }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK_RGB);
  doc.text(title, MARGIN, y);
  y += 8;

  doc.setDrawColor(...GOLD_RGB);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + 24, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`${labels.dateLabel} : ${labels.dateValue}`, MARGIN, y);
  y += 5;
  doc.text(`${labels.countLabel} : ${entries.length}`, MARGIN, y);
  y += 10;

  // Section — folder notes/memos, only when there's something to show
  if (notes?.trim()) {
    y = ensureSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK_RGB);
    doc.text(labels.notesTitle, MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY_RGB);
    const notesLines = doc.splitTextToSize(notes.trim(), CONTENT_WIDTH);
    notesLines.forEach((line) => {
      y = ensureSpace(doc, y, 5);
      doc.text(line, MARGIN, y);
      y += 5;
    });
    y += 6;
  }

  // Section — key indicators
  y = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.kpiTitle, MARGIN, y);
  y += 7;

  doc.setFontSize(9.5);
  labels.kpiRows.forEach(({ label, value }) => {
    y = ensureSpace(doc, y, 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_RGB);
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK_RGB);
    doc.text(String(value), MARGIN + 70, y);
    y += 5.5;
  });
  y += 5;

  // Section — per-optician detail
  y = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.detailTitle, MARGIN, y);
  y += 6;

  if (entries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(...LIGHT_GRAY_RGB);
    doc.text(labels.noEntries, MARGIN, y);
    y += 6;
  }

  entries.forEach((store) => {
    const cardHeight = measureCard(doc, store, labels);
    y = ensureSpace(doc, y, cardHeight);
    y = drawCard(doc, store, y, labels, statuses);
    y += 4;
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_RGB);
    doc.text(labels.footer, MARGIN, PAGE_HEIGHT - 8);
    doc.text(`${p} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });
  }

  doc.save(labels.filename);
}
