// Start/end time for a store's appointment ("RDV"), shared by both the
// Semaine day-planning tab and the Agenda & RDV tour list — a single
// per-store time rather than two separate ones, since "Envoyer vers
// l'Agenda" (CarnetView's handleSendDayToAgenda) is meant to carry the
// same appointment forward into today's tour, not schedule a second one.
// Per-device localStorage, same model as the rest of "Mon Carnet".
const APPOINTMENT_TIMES_KEY = "storeLocator_mycard_appointmenttimes";

function readTimes() {
  try {
    const raw = localStorage.getItem(APPOINTMENT_TIMES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeTimes(map) {
  localStorage.setItem(APPOINTMENT_TIMES_KEY, JSON.stringify(map));
  return map;
}

export function getAppointmentTimes() {
  return readTimes();
}

export function setAppointmentTime(storeId, start, end) {
  const times = readTimes();
  const updated = { ...times };
  if (start && end) {
    updated[storeId] = { start, end };
  } else {
    delete updated[storeId];
  }
  return writeTimes(updated);
}

export function clearAppointmentTime(storeId) {
  return setAppointmentTime(storeId, null, null);
}

// HH:MM -> minutes since midnight, used for chronological sorting and for
// picking "the next appointment" relative to the current time.
export function timeToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

// Today's date as a local YYYY-MM-DD key — built from local getters rather
// than `toISOString().slice(0, 10)` (which is UTC-based and can land on the
// wrong calendar day near midnight in France's timezone) or than a
// `Date.parse`/regex approach, matching the same local-date convention
// IcsExportModal already uses for its date picker's default value.
export function todayDateKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
