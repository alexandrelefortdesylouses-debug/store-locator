import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { timeToMinutes } from "../utils/appointmentTimes";
import { buildPreferredDirectionsUrl, GPS_APPS } from "../utils/gpsPrefs";

function formatTime(hhmm) {
  return hhmm ? hhmm.replace(":", "h") : "";
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
    </svg>
  );
}

function GpsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

// A compact "today's RDV" summary, overlaid on the map in "Ma Carte" only —
// rendered by App.jsx as the first item in the top-right toggle-button
// stack (Heatmap/Zones blanches/Ma position), deliberately *not* top-left,
// since that corner is where Leaflet's own zoom +/- control lives; sharing
// that stack also means it inherits the same >=16px edge margin and
// inter-item spacing as its neighbors for free, instead of needing its own
// positioning rules to keep in sync. This component itself stays
// position-agnostic (`relative`, not `absolute`) — its popover just hangs
// below and right-aligns to whichever button it's rendered next to.
//
// Deliberately reads from `routeStops` (App.jsx's live Agenda tour) rather
// than a separate date-aware source — routeStops is already documented
// elsewhere (CarnetWeekTab.jsx) as "today's tour", and "Envoyer vers
// l'Agenda" from the Semaine tab is exactly the hand-off that turns a
// planned day into that tour, so reusing it here avoids a second, possibly
// conflicting, definition of "today". Only stops with a start/end time set
// (see utils/appointmentTimes.js) count as an actual RDV — an untimed stop
// in the tour is still just a planned visit, not a scheduled appointment.
export default function TodayAgendaWidget({
  routeStops,
  appointmentTimes,
  preferredGpsApp = GPS_APPS.GOOGLE,
  routeOrigin = null,
  onOpenStore,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const timedStops = routeStops
    .filter((store) => appointmentTimes[store.id])
    .map((store) => ({ store, time: appointmentTimes[store.id] }))
    .sort((a, b) => timeToMinutes(a.time.start) - timeToMinutes(b.time.start));

  const nowMinutes = timeToMinutes(
    `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
  );
  const nextEntry =
    timedStops.find((entry) => timeToMinutes(entry.time.start) >= nowMinutes) || timedStops[0] || null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={timedStops.length === 0}
        className="flex max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3.5 py-2 text-left text-xs font-medium text-neutral-700 shadow-lg backdrop-blur transition hover:border-amber-400 disabled:cursor-default disabled:hover:border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-200 dark:disabled:hover:border-neutral-700 sm:max-w-[16rem]"
      >
        <ClockIcon />
        <span className="truncate">
          {nextEntry
            ? t("todayAgenda.next", { time: formatTime(nextEntry.time.start), name: nextEntry.store.name })
            : t("todayAgenda.none")}
        </span>
      </button>

      {open && timedStops.length > 0 && (
        <div className="absolute right-0 top-full z-[450] mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-2xl backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("todayAgenda.listTitle", { count: timedStops.length })}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("myCard.close")}
              className="cursor-pointer rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              ✕
            </button>
          </div>
          <ul className="thin-scrollbar max-h-72 overflow-y-auto p-2">
            {timedStops.map(({ store, time }) => (
              <li
                key={store.id}
                className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-amber-50 dark:hover:bg-neutral-800"
              >
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {formatTime(time.start)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenStore(store.id);
                  }}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    {store.name}
                  </p>
                  <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                    {store.address}, {store.city}
                  </p>
                </button>
                <a
                  href={buildPreferredDirectionsUrl(preferredGpsApp, store, routeOrigin)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("todayAgenda.directionsAria", { name: store.name })}
                  className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-amber-100 hover:text-amber-700 dark:text-neutral-500 dark:hover:bg-amber-950 dark:hover:text-amber-400"
                >
                  <GpsIcon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
