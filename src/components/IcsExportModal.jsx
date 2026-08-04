import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { buildDailySchedule } from "../utils/scheduling";
import { buildIcsCalendar, downloadIcsFile } from "../utils/icsExport";

const WINDOW_OPTIONS_MINUTES = [90, 105, 120];

function parseTimeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function IcsExportModal({ stops, onClose }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("precise");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [windowMinutes, setWindowMinutes] = useState(105);
  const [generating, setGenerating] = useState(false);

  function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    try {
      const today = new Date();
      const slotMinutes = mode === "precise" ? Number(durationMinutes) || 45 : windowMinutes;
      const schedule = buildDailySchedule({
        stops,
        date: today,
        startMinutes: parseTimeToMinutes(startTime),
        slotMinutes,
      });

      const dateStr = today.toISOString().slice(0, 10);
      const events = schedule.map(({ store, index, start, end, travelMinutes }) => ({
        uid: `${store.id}-${dateStr}@thelios-store-locator`,
        summary: `RDV : ${store.name} (Étape ${index + 1})`,
        location: store.address,
        description:
          travelMinutes === null
            ? "Premier arrêt de la tournée."
            : `Visite programmée via l'application. Temps de trajet estimé : ${travelMinutes} min.`,
        start,
        end,
      }));

      const ics = buildIcsCalendar(events);
      downloadIcsFile(ics, `tournee-${dateStr}.ics`);
      onClose();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
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

        <div className="thin-scrollbar overflow-y-auto p-5">
          <p className="mb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("ics.hint", { count: stops.length })}
          </p>

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

          <p className="mt-3 text-[11px] italic leading-relaxed text-neutral-400 dark:text-neutral-500">
            {t("ics.lunchHint")}
          </p>
        </div>

        <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {generating ? t("ics.generating") : t("ics.generate")}
          </button>
        </div>
      </div>
    </div>
  );
}
