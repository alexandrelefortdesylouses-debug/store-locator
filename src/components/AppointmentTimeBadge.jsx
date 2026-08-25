import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const DEFAULT_START = "09:00";
const DEFAULT_END = "09:30";

function formatTime(hhmm) {
  return hhmm ? hhmm.replace(":", "h") : "";
}

// Compact inline "create/edit RDV time" control, shared by the Agenda & RDV
// tab and the Semaine tab so a start/end time set in one place shows
// consistently in the other (both read/write the same per-store time via
// utils/appointmentTimes.js). Doubles as the appointment's "creation form"
// — a store with no time yet shows the same editor as one being edited,
// just starting from default values instead of the current ones.
export default function AppointmentTimeBadge({ start, end, onSave, onClear }) {
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
