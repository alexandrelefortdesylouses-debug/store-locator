import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { buildDailySchedule, estimateTravelMinutes } from "../utils/scheduling";
import { buildIcsCalendar, downloadIcsFile } from "../utils/icsExport";
import { haversineDistanceKm } from "../utils/geo";

const WINDOW_OPTIONS_MINUTES = [90, 105, 120];
const DEFAULT_START_TIME = "09:00";
const DEFAULT_DURATION_MINUTES = 45;
const TIME_PATTERN = /^\d{1,2}:\d{2}$/;

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseTimeToMinutes(value) {
  const safeValue = TIME_PATTERN.test(value) ? value : DEFAULT_START_TIME;
  const [h, m] = safeValue.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToHHMM(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function safeDurationMinutes(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DURATION_MINUTES;
}

function parseDateString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// The auto-chained default (start time + duration/window, one flowing into
// the next) is only a starting point: every row's time below stays freely
// editable afterward, with no rigid slot grid or forced sequencing.
function buildDefaultRows({ stops, startTime, slotMinutes }) {
  const schedule = buildDailySchedule({
    stops,
    date: new Date(),
    startMinutes: parseTimeToMinutes(startTime),
    slotMinutes,
  });
  return schedule.map(({ store, start }) => ({
    store,
    time: minutesToHHMM(start.getHours() * 60 + start.getMinutes()),
  }));
}

export default function IcsExportModal({ stops, onClose, onExported }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("precise");
  const [date, setDate] = useState(todayDateString());
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [windowMinutes, setWindowMinutes] = useState(105);
  const [rows, setRows] = useState(() =>
    buildDefaultRows({ stops, startTime: DEFAULT_START_TIME, slotMinutes: DEFAULT_DURATION_MINUTES }),
  );

  // Regenerates the default chained times whenever the auto-chain settings
  // change. Any time a user has hand-adjusted on an individual row is reset
  // by this — expected, since changing the base settings is a deliberate
  // "start over from a fresh default" action, same as switching mode.
  useEffect(() => {
    const slotMinutes = mode === "precise" ? safeDurationMinutes(durationMinutes) : windowMinutes;
    setRows(buildDefaultRows({ stops, startTime, slotMinutes }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startTime, durationMinutes, windowMinutes]);

  function handleRowTimeChange(index, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, time: value } : row)));
  }

  function handleGenerate() {
    const slotMinutes = mode === "precise" ? safeDurationMinutes(durationMinutes) : windowMinutes;
    const baseDate = parseDateString(date);

    // Close the modal immediately: the export itself runs synchronously
    // right after, so there's no need to keep the modal open while it does.
    onClose();

    const events = rows.map(({ store, time }, index) => {
      const minutes = parseTimeToMinutes(time);
      const start = new Date(baseDate);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(minutes);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + slotMinutes);

      let travelMinutes = null;
      if (index > 0) {
        const prevStore = rows[index - 1].store;
        const distanceKm = haversineDistanceKm(prevStore.lat, prevStore.lng, store.lat, store.lng);
        travelMinutes = estimateTravelMinutes(distanceKm);
      }

      return {
        uid: `${store.id}-${date}-${index}@store-locator`,
        summary: `RDV : ${store.name} (Étape ${index + 1})`,
        location: store.address,
        description:
          travelMinutes === null
            ? "Premier arrêt de la tournée."
            : `Visite programmée via l'application. Temps de trajet estimé : ${travelMinutes} min.`,
        start,
        end,
      };
    });

    const ics = buildIcsCalendar(events);
    downloadIcsFile(ics, `tournee-${date}.ics`);
    onExported?.();
  }

  // Rendered via a portal to document.body: this component's parent (the
  // floating RoutePlanner panel) uses backdrop-blur, and backdrop-filter
  // establishes a new containing block for position:fixed descendants in
  // Chromium — without the portal, "fixed inset-0" would size itself to
  // that small panel instead of the real viewport, clipping this modal
  // (and its footer button) off-screen instead of centering it on screen.
  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
            {t("ics.modalTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("myCard.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("ics.hint", { count: stops.length })}
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("ics.dateLabel")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayDateString())}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("precise")}
              className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                mode === "precise"
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
              }`}
            >
              <span className="block font-semibold">{t("ics.modeAName")}</span>
              <span className="mt-0.5 block opacity-80">{t("ics.modeADesc")}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("window")}
              className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                mode === "window"
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
              }`}
            >
              <span className="block font-semibold">{t("ics.modeBName")}</span>
              <span className="mt-0.5 block opacity-80">{t("ics.modeBDesc")}</span>
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("ics.startTimeLabel")}
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {mode === "precise" ? (
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t("ics.durationLabel")}
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          ) : (
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t("ics.windowLabel")}
              </label>
              <select
                value={windowMinutes}
                onChange={(e) => setWindowMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {WINDOW_OPTIONS_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {Math.floor(m / 60)}h{String(m % 60).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="mb-4 mt-3 text-[11px] italic leading-relaxed text-neutral-400 dark:text-neutral-500">
            {t("ics.lunchHint")}
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("ics.rowsTitle")}
            </label>
            <p className="mb-2 text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
              {t("ics.rowsHint")}
            </p>
            <ul className="flex flex-col gap-1.5">
              {rows.map((row, i) => (
                <li
                  key={row.store.id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-1.5 dark:border-neutral-700"
                >
                  <span className="w-5 shrink-0 text-right text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {i + 1}.
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-neutral-700 dark:text-neutral-200">
                    {row.store.name}
                  </span>
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => handleRowTimeChange(i, e.target.value)}
                    className="w-[6.5rem] shrink-0 rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="shrink-0 border-t border-neutral-200 p-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {t("ics.generate")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
