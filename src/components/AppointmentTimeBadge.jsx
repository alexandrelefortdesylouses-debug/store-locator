import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { todayDateKey } from "../utils/appointmentTimes";
import { buildIcsCalendar, downloadIcsFile } from "../utils/icsExport";

const DEFAULT_START = "09:00";
const DEFAULT_END = "09:30";

function formatTime(hhmm) {
  return hhmm ? hhmm.replace(":", "h") : "";
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
      <path strokeLinecap="round" d="M12 14v4M10 16h4" />
    </svg>
  );
}

// Builds a single-event .ics for one RDV — the same iCalendar builder used
// by the full-tournée export (IcsExportModal.jsx), just fed one event
// instead of the whole route, for a rep who only wants this one
// appointment on their phone's calendar without exporting the entire day.
function downloadAppointmentIcs(store, dateKey, start, end) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startDate = new Date(y, (m || 1) - 1, d || 1, sh || 0, sm || 0);
  const endDate = new Date(y, (m || 1) - 1, d || 1, eh || 0, em || 0);

  const ics = buildIcsCalendar([
    {
      uid: `${store.id}-${dateKey}@thelios-store-locator`,
      summary: `RDV : ${store.name}`,
      location: store.address,
      description: "Rendez-vous programmé via l'application.",
      start: startDate,
      end: endDate,
    },
  ]);
  downloadIcsFile(ics, `rdv-${store.id}-${dateKey}.ics`);
}

// Compact inline "create/edit RDV time" control, shared by the Agenda & RDV
// tab and the Semaine tab so a start/end time set in one place shows
// consistently in the other (both read/write the same per-store time via
// utils/appointmentTimes.js). Doubles as the appointment's "creation form"
// — a store with no time yet shows the same editor as one being edited,
// just starting from default values instead of the current ones.
export default function AppointmentTimeBadge({ start, end, store, date = todayDateKey(), onSave, onClear }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(start || DEFAULT_START);
  const [draftEnd, setDraftEnd] = useState(end || DEFAULT_END);

  function openEditor() {
    setDraftStart(start || DEFAULT_START);
    setDraftEnd(end || DEFAULT_END);
    setEditing(true);
  }

  function handleSave() {
    onSave(draftStart, draftEnd);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <input
          type="time"
          value={draftStart}
          onChange={(e) => setDraftStart(e.target.value)}
          className="w-[5.5rem] rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <span className="text-xs text-neutral-400" aria-hidden>
          –
        </span>
        <input
          type="time"
          value={draftEnd}
          onChange={(e) => setDraftEnd(e.target.value)}
          className="w-[5.5rem] rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={handleSave}
          aria-label={t("appointment.save")}
          className="cursor-pointer rounded-full p-1 text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label={t("appointment.cancel")}
          className="cursor-pointer rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          ✕
        </button>
      </div>
    );
  }

  if (start && end) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={openEditor}
          className="cursor-pointer rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
        >
          🕐 {formatTime(start)} – {formatTime(end)}
        </button>
        {store && (
          <button
            type="button"
            onClick={() => downloadAppointmentIcs(store, date, start, end)}
            aria-label={t("appointment.addToCalendar")}
            title={t("appointment.addToCalendar")}
            className="cursor-pointer rounded-full p-1 text-neutral-400 transition hover:bg-amber-50 hover:text-amber-700 dark:text-neutral-500 dark:hover:bg-amber-950 dark:hover:text-amber-400"
          >
            <CalendarIcon />
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t("appointment.clear")}
            className="cursor-pointer rounded-full p-1 text-neutral-300 transition hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openEditor}
      className="shrink-0 cursor-pointer rounded-full border border-dashed border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-amber-500 dark:hover:text-amber-400"
    >
      + {t("appointment.addTime")}
    </button>
  );
}
