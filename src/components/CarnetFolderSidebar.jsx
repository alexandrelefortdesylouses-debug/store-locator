import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { FOLDER_COLORS } from "../utils/folders";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

// The "..." menu for a custom folder: renaming hands control back to
// FolderRow (the input replaces the label in place), color picking and
// deleting are handled entirely here. Closes on an outside click, same
// pattern as SearchBar's suggestion dropdown.
function FolderMenu({ folder, onRequestRename, onChangeColor, onDelete }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("menu");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setMode("menu");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setMode("menu");
        }}
        aria-label={t("carnet.folders.menuAria")}
        className="hidden shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 group-hover:block dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="thin-scrollbar absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        >
          {mode === "menu" ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  onRequestRename();
                  setOpen(false);
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("carnet.folders.rename")}
              </button>
              <button
                type="button"
                onClick={() => setMode("color")}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("carnet.folders.changeColor")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {t("carnet.folders.delete")}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-1">
              {Object.entries(FOLDER_COLORS).map(([key, hex]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChangeColor(key);
                    setOpen(false);
                    setMode("menu");
                  }}
                  aria-label={t(`carnet.folders.color.${key}`)}
                  aria-pressed={folder.color === key}
                  className={`h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 transition ${
                    folder.color === key
                      ? "border-neutral-900 dark:border-white"
                      : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FixedFolderRow({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`flex shrink-0 min-w-0 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-full px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-amber-50 font-medium text-amber-800 dark:bg-neutral-800 dark:text-amber-400"
          : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">({count})</span>
    </button>
  );
}

function CustomFolderRow({ folder, count, active, onClick, onRename, onChangeColor, onDelete, onDropStore }) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [dragOver, setDragOver] = useState(false);

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    else setNameDraft(folder.name);
    setRenaming(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const storeId = e.dataTransfer.getData("text/plain");
    if (storeId) onDropStore(folder.id, storeId);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`group flex shrink-0 items-center gap-0.5 rounded-full transition ${
        active ? "bg-amber-50 dark:bg-neutral-800" : ""
      } ${dragOver ? "ring-2 ring-amber-400" : ""}`}
    >
      <span
        className="ml-3 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: FOLDER_COLORS[folder.color] || FOLDER_COLORS.gray }}
      />
      {renaming ? (
        <input
          autoFocus
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setNameDraft(folder.name);
              setRenaming(false);
            }
          }}
          className="min-w-0 flex-1 rounded-full border border-amber-400 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100"
        />
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          title={folder.name}
          className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-left text-sm transition ${
            active
              ? "font-medium text-amber-800 dark:text-amber-400"
              : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <span className="truncate">{folder.name}</span>
          <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">({count})</span>
        </button>
      )}
      {!renaming && (
        <FolderMenu
          folder={folder}
          onRequestRename={() => setRenaming(true)}
          onChangeColor={onChangeColor}
          onDelete={onDelete}
        />
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
  onRenameFolder,
  onChangeFolderColor,
  onDeleteFolder,
  onDropStoreOnFolder,
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
      <FixedFolderRow
        label={t("carnet.folders.all")}
        count={countsByFolder.all}
        active={selectedFolderId === "all"}
        onClick={() => onSelectFolder("all")}
      />
      <FixedFolderRow
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
        <CustomFolderRow
          key={folder.id}
          folder={folder}
          count={countsByFolder[folder.id] || 0}
          active={selectedFolderId === folder.id}
          onClick={() => onSelectFolder(folder.id)}
          onRename={(name) => onRenameFolder(folder.id, name)}
          onChangeColor={(color) => onChangeFolderColor(folder.id, color)}
          onDelete={() => onDeleteFolder(folder.id)}
          onDropStore={onDropStoreOnFolder}
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
