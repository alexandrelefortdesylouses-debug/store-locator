import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

function ChevronIcon({ collapsed }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Collapsible block above the table, shown only while a real custom folder
// (not "Tous les opticiens"/"Favoris") is selected — a place for the rep to
// jot down the objective or instructions tied to that specific grouping
// ("Rendez-vous fixés avant le 15, prévoir les nouveaux catalogues Dior…").
export default function CarnetFolderNotes({ folder, note, onSave }) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState(note);
  const [dirty, setDirty] = useState(false);

  // Reset the draft whenever the selected folder changes, so switching
  // folders doesn't leave a stale/unsaved draft from the previous one.
  useEffect(() => {
    setDraft(note);
    setDirty(false);
  }, [folder.id, note]);

  function handleSave() {
    onSave(draft);
    setDirty(false);
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {t("carnet.folders.notesTitle", { name: folder.name })}
        </span>
        <ChevronIcon collapsed={collapsed} />
      </button>
      {!collapsed && (
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDirty(true);
            }}
            rows={3}
            placeholder={t("carnet.folders.notesPlaceholder")}
            className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty}
            className="mt-2 cursor-pointer rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {t("carnet.folders.notesSave")}
          </button>
        </div>
      )}
    </div>
  );
}
