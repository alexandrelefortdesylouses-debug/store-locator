import { GOLD_ACCENT, INK, STATUS_COLORS } from "./palette";
import { getStoreZip } from "./postalCode";

const INK_HEX = INK.replace("#", "");
const GOLD_HEX = GOLD_ACCENT.replace("#", "");
const GRAY_HEX = "6E6C66";
const LIGHT_GRAY_HEX = "D6D2C8";
const CARD_BG_HEX = "FAF8F4";

function textLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => !(line === "" && (i === 0 || i === arr.length - 1)));
}

export async function exportEndOfDayReportDocx({ date, repName, globalNote, entries, statuses, labels }) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } =
    await import("docx");

  const heading = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD_HEX, space: 4 } },
      children: [new TextRun({ text, bold: true, color: INK_HEX, size: 26 })],
    });

  const infoLine = (label, value) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label} : `, bold: true, color: INK_HEX, size: 20 }),
        new TextRun({ text: value, color: GRAY_HEX, size: 20 }),
      ],
    });

  const globalNoteParagraphs = globalNote?.trim()
    ? textLines(globalNote).map(
        (line) =>
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: line || " ", color: GRAY_HEX, size: 21 })],
          }),
      )
    : [
        new Paragraph({
          children: [new TextRun({ text: labels.noGlobalNote, italics: true, color: LIGHT_GRAY_HEX, size: 21 })],
        }),
      ];

  function buildCard(entry) {
    const status = statuses[entry.store.id];
    const statusColor = status ? (STATUS_COLORS[status] || GOLD_ACCENT).replace("#", "") : null;
    const statusLabel = status ? labels.statusLabels[status] || status : null;
    const zip = getStoreZip(entry.store);
    const brandsText = entry.store.brands.join(", ");
    const noteLines = entry.note?.trim() ? textLines(entry.note) : [labels.noNote];

    const nameRuns = [new TextRun({ text: entry.store.name, bold: true, color: INK_HEX, size: 24 })];
    if (statusLabel) {
      nameRuns.push(new TextRun({ text: `   ●  `, color: statusColor, size: 20 }));
      nameRuns.push(new TextRun({ text: statusLabel, color: GRAY_HEX, size: 18 }));
    }

    const cellChildren = [
      new Paragraph({ spacing: { after: 40 }, children: nameRuns }),
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: `${entry.store.city}${zip ? ` (${zip})` : ""}`, color: GRAY_HEX, size: 19 })],
      }),
    ];

    if (brandsText) {
      cellChildren.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${labels.brandsLabel} : `, bold: true, color: GRAY_HEX, size: 18 }),
            new TextRun({ text: brandsText, color: GRAY_HEX, size: 18 }),
          ],
        }),
      );
    }

    cellChildren.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: labels.noteLabel, bold: true, color: INK_HEX, size: 19 })],
      }),
    );
    noteLines.forEach((line, i) => {
      cellChildren.push(
        new Paragraph({
          spacing: { after: i === noteLines.length - 1 ? 0 : 40 },
          children: [
            new TextRun({
              text: line || " ",
              italics: !entry.note?.trim(),
              color: entry.note?.trim() ? GRAY_HEX : LIGHT_GRAY_HEX,
              size: 20,
            }),
          ],
        }),
      );
    });

    const border = { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GRAY_HEX };
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: CARD_BG_HEX },
              margins: { top: 150, bottom: 150, left: 150, right: 150 },
              borders: { top: border, bottom: border, left: border, right: border },
              children: cellChildren,
            }),
          ],
        }),
      ],
    });
  }

  const detailChildren =
    entries.length === 0
      ? [new Paragraph({ children: [new TextRun({ text: labels.noVisits, italics: true, color: LIGHT_GRAY_HEX, size: 20 })] })]
      : entries.flatMap((entry) => [buildCard(entry), new Paragraph({ spacing: { after: 150 }, children: [] })]);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: labels.title, bold: true, color: INK_HEX, size: 40 })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD_HEX, space: 4 } },
            children: [new TextRun({ text: " " })],
          }),
          infoLine(labels.dateLabel, date),
          infoLine(labels.repLabel, repName?.trim() || labels.repPlaceholder),
          infoLine(labels.countLabel, String(entries.length)),
          heading(labels.globalTitle),
          ...globalNoteParagraphs,
          heading(labels.detailTitle),
          ...detailChildren,
          new Paragraph({
            spacing: { before: 300 },
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: labels.footer, italics: true, color: GRAY_HEX, size: 16 })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = labels.docxFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
