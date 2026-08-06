import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

function FolderRow({ label, count, active, onClick, onDelete, deleteLabel }) {
  return (
    <div
      className={`group flex shrink-0 items-center gap-0.5 rounded-full ${
        active ? "bg-amber-50 dark:bg-neutral-800" : ""
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 py-2 text-left text-sm transition ${
          active
            ? "font-medium text-amber-800 dark:text-amber-400"
            : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">({count})</span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          className="hidden shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:text-red-500 group-hover:block dark:text-neutral-500 dark:hover:text-red-400"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Left-hand "mail client" folder rail for Mon Carnet > Tableau: two fixed
// entries (all portfolio stores, favorites) plus any custom folders the rep
// has created to group stores for a purpose (a route, a brand focus…).
// Stacks as a horizontal scrollable chip row on narrow screens instead of a
// vertical list, since there's no room for a fixed side column there.
export default function CarnetFolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  countsByFolder,
}) {
  const { t } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed);
    setNewFolderName("");
    setShowCreate(false);
  }

  return (
    <div className="thin-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900 sm:w-56 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-3">
      <FolderRow
        label={t("carnet.folders.all")}
        count={countsByFolder.all}
        active={selectedFolderId === "all"}
        onClick={() => onSelectFolder("all")}
      />
      <FolderRow
        label={t("carnet.folders.favorites")}
        count={countsByFolder.favorites}
        active={selectedFolderId === "favorites"}
        onClick={() => onSelectFolder("favorites")}
      />

      {folders.length > 0 && (
        <div className="hidden px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 sm:block">
          {t("carnet.folders.customTitle")}
        </div>
      )}
      {folders.map((folder) => (
        <FolderRow
          key={folder.id}
          label={folder.name}
          count={countsByFolder[folder.id] || 0}
          active={selectedFolderId === folder.id}
          onClick={() => onSelectFolder(folder.id)}
          onDelete={() => onDeleteFolder(folder.id)}
          deleteLabel={t("carnet.folders.deleteAria")}
        />
      ))}

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="flex shrink-0 items-center gap-1.5 sm:mt-2 sm:flex-col sm:items-stretch sm:px-1"
        >
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t("carnet.folders.namePlaceholder")}
            className="w-32 min-w-0 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:w-full"
          />
          <div className="flex shrink-0 gap-1.5">
            <button
              type="submit"
              className="cursor-pointer rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
            >
              {t("carnet.folders.create")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewFolderName("");
              }}
              className="cursor-pointer rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300"
            >
              {t("carnet.folders.cancel")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-neutral-800 sm:mt-1"
        >
          + {t("carnet.folders.newFolder")}
        </button>
      )}
    </div>
  );
}
