import { currentDay } from "./dateRanges";

function isInRange(isoDate, range) {
  const d = new Date(isoDate);
  return d >= range.start && d < range.end;
}

// One row per portfolio store, not just the ones with a note today: the
// end-of-day report lets the rep tick off whichever opticians they actually
// visited (checkbox selection), rather than relying solely on whether a
// visit note happens to already be logged. `hasNoteToday`/`note` are still
// derived from today's dated visit notes (Mon Carnet > Bloc-Notes) so a
// store with a note already logged today is pre-checked and pre-filled —
// a sensible default the rep can freely override before export.
export function buildReportRows({ stores, visitNotes, referenceDate = new Date() }) {
  const today = currentDay(referenceDate);

  return stores
    .map((store) => {
      const entries = (visitNotes[store.id] || []).filter((entry) => isInRange(entry.date, today));
      return {
        store,
        note: entries[0]?.text || "",
        hasNoteToday: entries.length > 0,
      };
    })
    .sort((a, b) => a.store.name.localeCompare(b.store.name));
}
