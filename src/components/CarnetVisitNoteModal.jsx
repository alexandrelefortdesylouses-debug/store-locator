import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import StatusDot from "./StatusDot";

// Per-store dated visit-note entry, opened from Mon Carnet table's "Note"
// action. Kept on the same data layer as before (utils/activity.js) — this
// modal only relocates the entry UI that used to live inline in the
// Bloc-Notes tab, now that tab is a single global freeform note instead.
export default function CarnetVisitNoteModal({ store, status, entries, onAddVisitNote, onClose }) {
  const { t, lang } = useLanguage();
  const [draft, setDraft] = useState("");
  const locale = lang === "en" ? "en-US" : "fr-FR";

  function handleAdd() {
    if (!draft.trim()) return;
    onAddVisitNote(store.id, draft.trim());
    setDraft("");
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <StatusDot status={status} />
            <div>
              <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">{store.name}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {store.address}, {store.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("storeDetail.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder={t("carnet.notes.addPlaceholder")}
              className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="mt-2 cursor-pointer rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
            >
              {t("carnet.notes.addButton")}
            </button>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("carnet.notes.historyTitle", { count: entries.length })}
          </p>
          {entries.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("carnet.notes.noHistory")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    {new Date(entry.date).toLocaleDateString(locale, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-200">{entry.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
