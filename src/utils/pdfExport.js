import { GOLD_ACCENT, INK } from "./palette";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

// Not a real map screenshot (no reliable, CORS-safe way to rasterize
// Leaflet tiles offline) — a schematic diagram instead: each stop's
// lat/lng is normalized into a bounded box and connected in visiting
// order, numbered to match the on-screen route markers.
function drawRouteSchematic(doc, stops, origin, box) {
  const points = [...(origin ? [{ lat: origin.lat, lng: origin.lng, isOrigin: true }] : []), ...stops];
  if (points.length === 0) return;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const pad = box.height * 0.12;

  const project = (p) => ({
    x: box.x + pad + ((p.lng - minLng) / lngRange) * (box.width - pad * 2),
    y: box.y + box.height - pad - ((p.lat - minLat) / latRange) * (box.height - pad * 2),
  });

  doc.setDrawColor(...LIGHT_GRAY_RGB);
  doc.setLineWidth(0.3);
  doc.rect(box.x, box.y, box.width, box.height);

  const projected = points.map(project);

  doc.setDrawColor(...GOLD_RGB);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([1.5, 1.2], 0);
  for (let i = 0; i < projected.length - 1; i++) {
    doc.line(projected[i].x, projected[i].y, projected[i + 1].x, projected[i + 1].y);
  }
  doc.setLineDashPattern([], 0);

  projected.forEach((pt, i) => {
    const isOrigin = points[i].isOrigin;
    doc.setFillColor(...(isOrigin ? [37, 99, 235] : INK_RGB));
    doc.circle(pt.x, pt.y, isOrigin ? 2.6 : 3.2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    const label = isOrigin ? "•" : String(i - (origin ? 1 : 0) + 1);
    doc.text(label, pt.x, pt.y + 1, { align: "center" });
  });

  doc.setTextColor(...GRAY_RGB);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("Schéma d'itinéraire (non à l'échelle)", box.x, box.y + box.height + 4);
}

function drawRuledLines(doc, x, y, width, count, gap = 6) {
  doc.setDrawColor(...LIGHT_GRAY_RGB);
  doc.setLineWidth(0.2);
  for (let i = 0; i < count; i++) {
    const lineY = y + i * gap;
    doc.line(x, lineY, x + width, lineY);
  }
  return y + count * gap;
}

export async function exportRoutePdf({ stops, order, userLocation, notes = {}, labels }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const displayStops = order && order.length > 0 ? order : stops;

  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.title, MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`${labels.dateLabel} : ${labels.dateValue}`, MARGIN, y);
  y += 5;
  doc.text(`${labels.repLabel} : ______________________________`, MARGIN, y);
  y += 10;

  const mapBoxHeight = 62;
  drawRouteSchematic(doc, displayStops, userLocation, {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    height: mapBoxHeight,
  });
  y += mapBoxHeight + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.stopsTitle, MARGIN, y);
  y += 6;

  displayStops.forEach((store, i) => {
    if (y > PAGE_HEIGHT - 45) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFillColor(...GOLD_RGB);
    doc.circle(MARGIN + 3, y + 1.5, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(i + 1), MARGIN + 3, y + 2.6, { align: "center" });

    doc.setTextColor(...INK_RGB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(store.name, MARGIN + 9, y + 2.5);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_RGB);
    const addressLines = doc.splitTextToSize(store.address, CONTENT_WIDTH - 9);
    addressLines.forEach((line) => {
      doc.text(line, MARGIN + 9, y);
      y += 4.2;
    });

    const details = [store.phone, store.brands.join(", ")].filter(Boolean).join("   •   ");
    if (details) {
      doc.text(details, MARGIN + 9, y);
      y += 4.2;
    }

    const existingNote = notes[store.id];
    if (existingNote) {
      doc.setFont("helvetica", "italic");
      const noteLines = doc.splitTextToSize(`${labels.noteLabel} : ${existingNote}`, CONTENT_WIDTH - 9);
      noteLines.forEach((line) => {
        doc.text(line, MARGIN + 9, y);
        y += 4.2;
      });
    }

    y += 2;
    doc.setDrawColor(...LIGHT_GRAY_RGB);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 6;
  });

  if (y > PAGE_HEIGHT - 60) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK_RGB);
  doc.text(labels.reportTitle, MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_RGB);
  doc.text(labels.reportHint, MARGIN, y);
  y += 6;

  drawRuledLines(doc, MARGIN, y, CONTENT_WIDTH, 10, 7);

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
