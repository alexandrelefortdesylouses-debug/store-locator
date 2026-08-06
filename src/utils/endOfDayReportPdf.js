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
// — jsPDF has no layout engine, so this has to be done by hand.
function measureCard(doc, entry, labels) {
  const textWidth = CONTENT_WIDTH - CARD_PADDING * 2;
  let height = CARD_PADDING + 5.5; // name line
  height += 4.5; // city/zip line

  doc.setFontSize(8.5);
  const brandsText = entry.store.brands.join(", ");
  if (brandsText) {
    height += doc.splitTextToSize(`${labels.brandsLabel} : ${brandsText}`, textWidth).length * 4;
  }

  height += 2; // gap before note
  height += 4.2; // "Note individuelle" label line
  const noteText = entry.note?.trim() || labels.noNote;
  height += doc.splitTextToSize(noteText, textWidth).length * 4;
  height += CARD_PADDING;
  return height;
}

function drawCard(doc, entry, y, labels, statuses) {
  const height = measureCard(doc, entry, labels);
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
  doc.text(entry.store.name, textX, cursorY);

  const status = statuses[entry.store.id];
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

  const zip = getStoreZip(entry.store);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`${entry.store.city}${zip ? ` (${zip})` : ""}`, textX, cursorY);
  cursorY += 4.5;

  const brandsText = entry.store.brands.join(", ");
  if (brandsText) {
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY_RGB);
    const brandLines = doc.splitTextToSize(`${labels.brandsLabel} : ${brandsText}`, textWidth);
    brandLines.forEach((line) => {
      doc.text(line, textX, cursorY);
      cursorY += 4;
    });
  }

  cursorY += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.noteLabel, textX, cursorY);
  cursorY += 4.2;

  doc.setFont("helvetica", entry.note?.trim() ? "normal" : "italic");
  doc.setFontSize(9);
  doc.setTextColor(...(entry.note?.trim() ? GRAY_RGB : LIGHT_GRAY_RGB));
  const noteLines = doc.splitTextToSize(entry.note?.trim() || labels.noNote, textWidth);
  noteLines.forEach((line) => {
    doc.text(line, textX, cursorY);
    cursorY += 4;
  });

  return y + height;
}

export async function exportEndOfDayReportPdf({ date, repName, globalNote, entries, statuses, labels }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.title, MARGIN, y);
  y += 8;

  doc.setDrawColor(...GOLD_RGB);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + 24, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`${labels.dateLabel} : ${date}`, MARGIN, y);
  y += 5;
  doc.text(`${labels.repLabel} : ${repName?.trim() || labels.repPlaceholder}`, MARGIN, y);
  y += 5;
  doc.text(`${labels.countLabel} : ${entries.length}`, MARGIN, y);
  y += 10;

  // Section 1 — global summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.globalTitle, MARGIN, y);
  y += 6;

  doc.setFont("helvetica", globalNote?.trim() ? "normal" : "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...(globalNote?.trim() ? GRAY_RGB : LIGHT_GRAY_RGB));
  const globalLines = doc.splitTextToSize(globalNote?.trim() || labels.noGlobalNote, CONTENT_WIDTH);
  globalLines.forEach((line) => {
    y = ensureSpace(doc, y, 5);
    doc.text(line, MARGIN, y);
    y += 5;
  });
  y += 6;

  // Section 2 — per-optician detail
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
    doc.text(labels.noVisits, MARGIN, y);
    y += 6;
  }

  entries.forEach((entry) => {
    const cardHeight = measureCard(doc, entry, labels);
    y = ensureSpace(doc, y, cardHeight);
    y = drawCard(doc, entry, y, labels, statuses);
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
