import { currentDay } from "./dateRanges";

function isInRange(isoDate, range) {
  const d = new Date(isoDate);
  return d >= range.start && d < range.end;
}

// "Opticiens visités dans la journée" = portfolio stores with at least one
// dated visit note (Mon Carnet > Bloc-Notes) logged today. Each entry's
// `note` defaults to the latest of today's notes for that store (entries
// are stored newest-first) — a starting point the report modal lets the
// user edit before export, not a fixed transcript.
export function getTodaysVisitedStores({ stores, visitNotes, referenceDate = new Date() }) {
  const today = currentDay(referenceDate);

  return stores
    .map((store) => {
      const entries = (visitNotes[store.id] || []).filter((entry) => isInRange(entry.date, today));
      if (entries.length === 0) return null;
      return { store, note: entries[0].text };
    })
    .filter(Boolean)
    .sort((a, b) => a.store.name.localeCompare(b.store.name));
}
