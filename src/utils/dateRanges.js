function startOfIsoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export function currentAndPreviousWeek(referenceDate = new Date()) {
  const currentStart = startOfIsoWeek(referenceDate);
  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 7);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: currentStart },
  };
}

export function currentAndPreviousMonth(referenceDate = new Date()) {
  const currentStart = startOfMonth(referenceDate);
  const currentEnd = new Date(currentStart);
  currentEnd.setMonth(currentEnd.getMonth() + 1);
  const previousStart = new Date(currentStart);
  previousStart.setMonth(previousStart.getMonth() - 1);
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: currentStart },
  };
}
