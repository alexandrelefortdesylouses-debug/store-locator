import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import StatusDot from "./StatusDot";

export default function CarnetNotesTab({
  stores,
  selectedStoreId,
  onSelectStore,
  statuses,
  visitNotes,
  onAddVisitNote,
}) {
  const { t, lang } = useLanguage();
  const [draft, setDraft] = useState("");
  const locale = lang === "en" ? "en-US" : "fr-FR";

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => a.name.localeCompare(b.name)),
    [stores],
  );
  const selectedStore =
    stores.find((s) => s.id === selectedStoreId) || sortedStores[0] || null;

  function handleAdd() {
    if (!selectedStore || !draft.trim()) return;
    onAddVisitNote(selectedStore.id, draft.trim());
    setDraft("");
  }

  if (stores.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        {t("carnet.notes.emptyPortfolio")}
      </p>
    );
  }

  const entries = selectedStore ? visitNotes[selectedStore.id] || [] : [];

  return (
    <div className="max-w-2xl">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("carnet.notes.selectLabel")}
      </label>
      <select
        value={selectedStore?.id || ""}
        onChange={(e) => onSelectStore(e.target.value)}
        className="mb-4 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      >
        {sortedStores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name} — {store.city}
          </option>
        ))}
      </select>

      {selectedStore && (
        <>
          <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              <StatusDot status={statuses[selectedStore.id]} />
              <p className="font-serif text-base text-neutral-900 dark:text-neutral-100">
                {selectedStore.name}
              </p>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {selectedStore.address}, {selectedStore.city}
            </p>
          </div>

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
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {t("carnet.notes.noHistory")}
            </p>
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
        </>
      )}
    </div>
  );
}
