import { useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";

// Opened from the Actions column of Mon Carnet's table: lets the rep file
// one store into any number of folders (checkbox list, toggled directly —
// no separate "save" step) or spin up a brand new folder and drop the
// store into it in one action.
export default function FolderAssignModal({
  store,
  folders,
  folderMembers,
  onToggleMembership,
  onCreateAndAssign,
  onClose,
}) {
  const { t } = useLanguage();
  const [newFolderName, setNewFolderName] = useState("");

  function handleCreateAndAdd(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateAndAssign(trimmed, store.id);
    setNewFolderName("");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-serif text-base text-neutral-900 dark:text-neutral-100">
            {t("carnet.folders.assignTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("myCard.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 truncate text-xs text-neutral-500 dark:text-neutral-400">{store.name}</p>

        {folders.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            {t("carnet.folders.empty")}
          </p>
        ) : (
          <div className="thin-scrollbar mb-3 flex max-h-52 flex-col gap-0.5 overflow-y-auto">
            {folders.map((folder) => {
              const active = (folderMembers[folder.id] || []).includes(store.id);
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onToggleMembership(folder.id, store.id)}
                  aria-pressed={active}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${
                      active
                        ? "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {active && (
                      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <form
          onSubmit={handleCreateAndAdd}
          className="flex gap-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-700"
        >
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t("carnet.folders.namePlaceholder")}
            className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {t("carnet.folders.createAndAdd")}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
