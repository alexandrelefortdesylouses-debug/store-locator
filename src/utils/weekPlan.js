// Multi-day tour planning ("Semaine" tab in Mon Carnet): assigns portfolio
// stores to specific calendar dates. Deliberately separate from
// `routeStops` (App.jsx state, used by RoutePlanner/CarnetAgendaTab), which
// stays "today's tour" — sending a planned day to the Agenda loads it into
// that same state, but the week plan itself persists independently so it
// isn't lost when the active route is cleared. Per-device localStorage
// only, same model as the rest of "Mon Carnet".
const WEEK_PLAN_KEY = "storeLocator_mycard_weekplan";

// { [ISODateString]: [storeId, ...] } — a store lives on at most one day at
// a time; assigning it to a new day removes it from whichever day it was
// on before, so the "unplanned pool" and the day columns never disagree
// about where a store currently sits.
function readPlan() {
  try {
    const raw = localStorage.getItem(WEEK_PLAN_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writePlan(plan) {
  localStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(plan));
  return plan;
}

export function getWeekPlan() {
  return readPlan();
}

export function assignStoreToDay(storeId, dateKey) {
  const plan = readPlan();
  const next = {};
  Object.entries(plan).forEach(([day, ids]) => {
    const filtered = ids.filter((id) => id !== storeId);
    if (filtered.length > 0) next[day] = filtered;
  });
  next[dateKey] = [...(next[dateKey] || []), storeId];
  return writePlan(next);
}

export function removeStoreFromDay(storeId, dateKey) {
  const plan = readPlan();
  const remaining = (plan[dateKey] || []).filter((id) => id !== storeId);
  const next = { ...plan };
  if (remaining.length > 0) next[dateKey] = remaining;
  else delete next[dateKey];
  return writePlan(next);
}

export function clearWeekPlan() {
  return writePlan({});
}

// Naive geographic grouping for "Répartir automatiquement": sorts stores by
// latitude (a simple north-south banding that keeps day-to-day travel
// roughly regional across most of France's geography) and chunks them
// evenly across the given day keys — a deliberately simple heuristic, not
// a real clustering algorithm, in the same spirit as the route
// optimizer's nearest-neighbor fallback for large tours.
export function autoDistribute(storeIds, storesById, dayKeys) {
  const sorted = [...storeIds].sort((a, b) => {
    const la = storesById.get(a)?.lat ?? 0;
    const lb = storesById.get(b)?.lat ?? 0;
    return lb - la;
  });
  const plan = { ...readPlan() };
  const perDay = Math.ceil(sorted.length / dayKeys.length) || 1;
  dayKeys.forEach((dayKey, i) => {
    const chunk = sorted.slice(i * perDay, (i + 1) * perDay);
    if (chunk.length === 0) return;
    plan[dayKey] = [...(plan[dayKey] || []), ...chunk];
  });
  return writePlan(plan);
}
