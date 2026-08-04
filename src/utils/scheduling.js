import { haversineDistanceKm } from "./geo";

const LUNCH_BREAK_THRESHOLD_MINUTES = 12 * 60 + 30; // 12:30
const LUNCH_RESUME_MINUTES = 14 * 60; // 14:00

// No real routing/driving-time API is integrated, so travel time between
// consecutive stops is estimated from straight-line (haversine) distance at
// an assumed average road speed. This is a rough approximation, not a
// real-world driving-time prediction.
const AVERAGE_SPEED_KMH = 45;

export function estimateTravelMinutes(distanceKm) {
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
}

function minutesToDate(baseDate, minutes) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
}

// Builds a chained day schedule for an ordered list of stops: each stop
// starts when the previous one ends plus the estimated travel time to reach
// it, with an automatic lunch break inserted the first time the running
// clock reaches 12:30 (resuming at 14:00). Handles any number of stops.
//
// mode "precise": every stop gets a fixed `slotMinutes` duration.
// mode "window": every stop gets a fixed, wider `slotMinutes` window
// (same chaining logic — the caller just passes a bigger slot size).
export function buildDailySchedule({ stops, date, startMinutes, slotMinutes }) {
  let currentMinutes = startMinutes;
  let lunchApplied = false;
  const schedule = [];

  stops.forEach((store, index) => {
    let travelMinutes = null;
    if (index > 0) {
      const prevStore = stops[index - 1];
      const distanceKm = haversineDistanceKm(prevStore.lat, prevStore.lng, store.lat, store.lng);
      travelMinutes = estimateTravelMinutes(distanceKm);
      currentMinutes += travelMinutes;
    }

    if (!lunchApplied && currentMinutes >= LUNCH_BREAK_THRESHOLD_MINUTES) {
      currentMinutes = LUNCH_RESUME_MINUTES;
      lunchApplied = true;
    }

    const start = minutesToDate(date, currentMinutes);
    const end = minutesToDate(date, currentMinutes + slotMinutes);

    schedule.push({ store, index, start, end, travelMinutes });

    currentMinutes += slotMinutes;
  });

  return schedule;
}
