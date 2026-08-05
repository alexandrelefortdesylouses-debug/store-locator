import { currentAndPreviousWeek, currentAndPreviousMonth } from "./dateRanges";

function isInRange(isoDate, range) {
  const d = new Date(isoDate);
  return d >= range.start && d < range.end;
}

// Visites réalisées: count of dated visit notes logged in the range.
// Nouveaux prospects contactés: stores that first became a "prospect" during
// the range (not simply still a prospect from before).
// Taux de couverture du secteur: share of the portfolio with at least one
// logged visit note in the range — an approximation of "sector coverage"
// built from actual logged activity, since the app has no real notion of
// sales territories.
function computePeriodMetrics({ storeIds, visitNotes, prospectFirstSeen, range }) {
  let visits = 0;
  let visitedStoreCount = 0;

  storeIds.forEach((id) => {
    const entries = visitNotes[id] || [];
    const inRangeEntries = entries.filter((entry) => isInRange(entry.date, range));
    visits += inRangeEntries.length;
    if (inRangeEntries.length > 0) visitedStoreCount += 1;
  });

  const newProspects = storeIds.filter(
    (id) => prospectFirstSeen[id] && isInRange(prospectFirstSeen[id], range),
  ).length;

  const coverageRate = storeIds.length > 0 ? (visitedStoreCount / storeIds.length) * 100 : 0;

  return { visits, newProspects, coverageRate };
}

export function computeComparativePerformance({ storeIds, visitNotes, prospectFirstSeen }) {
  const weeks = currentAndPreviousWeek();
  const months = currentAndPreviousMonth();

  return {
    week: {
      current: computePeriodMetrics({ storeIds, visitNotes, prospectFirstSeen, range: weeks.current }),
      previous: computePeriodMetrics({ storeIds, visitNotes, prospectFirstSeen, range: weeks.previous }),
    },
    month: {
      current: computePeriodMetrics({ storeIds, visitNotes, prospectFirstSeen, range: months.current }),
      previous: computePeriodMetrics({ storeIds, visitNotes, prospectFirstSeen, range: months.previous }),
    },
  };
}
