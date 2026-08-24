import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { FOLDER_COLORS, FOLDER_SORT_MODES, sortFolderSiblings } from "../utils/folders";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

// The "..." menu for a custom folder: renaming hands control back to
// FolderRow (the input replaces the label in place), color picking,
// subfolder creation, reordering and deleting are handled entirely here.
// Closes on an outside click, same pattern as SearchBar's suggestion
// dropdown.
function FolderMenu({ folder, onRequestRename, onChangeColor, onCreateSubfolder, onMoveUp, onMoveDown, onDelete }) {
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
        draggable={false}
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
          onMouseDown={(e) => e.stopPropagation()}
          className="thin-scrollbar absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
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
                  onCreateSubfolder();
                  setOpen(false);
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("carnet.folders.newSubfolder")}
              </button>
              {(onMoveUp || onMoveDown) && (
                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
              )}
              {onMoveUp && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveUp();
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  ↑ {t("carnet.folders.moveUp")}
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveDown();
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  ↓ {t("carnet.folders.moveDown")}
                </button>
              )}
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
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

// A single folder or subfolder row: draggable onto another sibling row to
// reorder (custom mode is engaged automatically by the parent as soon as a
// drag or Monter/Descendre happens), and itself a drop target both for a
// dragged store (assign) and a dragged sibling folder (reorder) —
// distinguished by dataTransfer type ("text/plain" for a store id vs
// "application/x-folder-id" for a folder id).
function CustomFolderRow({
  folder,
  depth,
  count,
  active,
  hasChildren,
  expanded,
  onToggleExpand,
  onClick,
  onRename,
  onChangeColor,
  onCreateSubfolder,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDropStore,
  onDropFolder,
}) {
  const { t } = useLanguage();
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(folder.name);
  const [dragOver, setDragOver] = useState(false);

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    else setNameDraft(folder.name);
    setRenaming(false);
  }

  function handleDragStart(e) {
    e.dataTransfer.setData("application/x-folder-id", folder.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const draggedFolderId = e.dataTransfer.getData("application/x-folder-id");
    if (draggedFolderId && draggedFolderId !== folder.id) {
      onDropFolder(draggedFolderId, folder.id);
      return;
    }
    const storeId = e.dataTransfer.getData("text/plain");
    if (storeId) onDropStore(folder.id, storeId);
  }

  return (
    <div
      draggable={!renaming}
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{ paddingLeft: depth * 14 }}
      className={`group flex shrink-0 cursor-grab items-center gap-0.5 rounded-full transition active:cursor-grabbing ${
        active ? "bg-amber-50 dark:bg-neutral-800" : ""
      } ${dragOver ? "ring-2 ring-amber-400" : ""}`}
    >
      {hasChildren ? (
        <button
          type="button"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          aria-label={t(expanded ? "carnet.folders.collapseAria" : "carnet.folders.expandAria")}
          className="shrink-0 cursor-pointer rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
        >
          <ChevronIcon expanded={expanded} />
        </button>
      ) : (
        <span className="w-[22px] shrink-0" />
      )}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
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
          onCreateSubfolder={onCreateSubfolder}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// Left-hand "mail client" folder rail for Mon Carnet > Tableau: two fixed
// entries (all portfolio stores, favorites) plus a fully custom tree of
// folders/subfolders the rep builds to group stores for a purpose (a
// sector, a route, a brand focus…). Stacks as a horizontal scrollable chip
// row on narrow screens instead of a vertical list, since there's no room
// for a fixed side column there — subfolder indentation still applies via
// left padding, it just reads less cleanly in a single scrolling row.
export default function CarnetFolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onChangeFolderColor,
  onDeleteFolder,
  onDropStoreOnFolder,
  onReorderFolderStep,
  onReorderFolderDrop,
  countsByFolder,
  sortMode,
  onSetSortMode,
}) {
  const { t } = useLanguage();
  // null = no create form open; "root" = new top-level folder; a folder id
  // = new subfolder under that folder.
  const [showCreate, setShowCreate] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  function toggleCollapsed(folderId) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed, showCreate === "root" ? null : showCreate);
    setNewFolderName("");
    setShowCreate(null);
  }

  function renderCreateForm(depth) {
    return (
      <form
        onSubmit={handleCreateSubmit}
        style={{ paddingLeft: depth * 14 }}
        className="flex shrink-0 items-center gap-1.5 sm:mt-1 sm:flex-col sm:items-stretch sm:px-1"
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
              setShowCreate(null);
              setNewFolderName("");
            }}
            className="cursor-pointer rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300"
          >
            {t("carnet.folders.cancel")}
          </button>
        </div>
      </form>
    );
  }

  function renderFolder(folder, depth) {
    const children = folders.filter((f) => f.parentId === folder.id);
    const sortedChildren = sortFolderSiblings(children, sortMode, countsByFolder);
    const hasChildren = children.length > 0;
    const expanded = !collapsedIds.has(folder.id);
    const siblings = sortFolderSiblings(
      folders.filter((f) => f.parentId === folder.parentId),
      sortMode,
      countsByFolder,
    );
    const idx = siblings.findIndex((f) => f.id === folder.id);

    return (
      <div key={folder.id} className="flex shrink-0 flex-col sm:contents">
        <CustomFolderRow
          folder={folder}
          depth={depth}
          count={countsByFolder[folder.id] || 0}
          active={selectedFolderId === folder.id}
          hasChildren={hasChildren}
          expanded={expanded}
          onToggleExpand={() => toggleCollapsed(folder.id)}
          onClick={() => onSelectFolder(folder.id)}
          onRename={(name) => onRenameFolder(folder.id, name)}
          onChangeColor={(color) => onChangeFolderColor(folder.id, color)}
          onCreateSubfolder={() => {
            setShowCreate(folder.id);
            setNewFolderName("");
          }}
          onMoveUp={idx > 0 ? () => onReorderFolderStep(folder.id, "up") : null}
          onMoveDown={idx < siblings.length - 1 ? () => onReorderFolderStep(folder.id, "down") : null}
          onDelete={() => onDeleteFolder(folder.id)}
          onDropStore={onDropStoreOnFolder}
          onDropFolder={onReorderFolderDrop}
        />
        {showCreate === folder.id && renderCreateForm(depth + 1)}
        {expanded && sortedChildren.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  }

  const topFolders = sortFolderSiblings(
    folders.filter((f) => !f.parentId),
    sortMode,
    countsByFolder,
  );

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
        <div className="flex shrink-0 flex-col gap-1 sm:mt-1">
          <label className="hidden px-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 sm:block">
            {t("carnet.folders.sortLabel")}
          </label>
          <select
            value={sortMode}
            onChange={(e) => onSetSortMode(e.target.value)}
            aria-label={t("carnet.folders.sortLabel")}
            className="w-32 shrink-0 cursor-pointer rounded-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 sm:w-full sm:rounded-lg"
          >
            <option value={FOLDER_SORT_MODES.CUSTOM}>{t("carnet.folders.sortCustom")}</option>
            <option value={FOLDER_SORT_MODES.ALPHA}>{t("carnet.folders.sortAlpha")}</option>
            <option value={FOLDER_SORT_MODES.COUNT}>{t("carnet.folders.sortCount")}</option>
            <option value={FOLDER_SORT_MODES.CREATED}>{t("carnet.folders.sortCreated")}</option>
          </select>
        </div>
      )}

      {folders.length > 0 && (
        <div className="hidden px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 sm:block">
          {t("carnet.folders.customTitle")}
        </div>
      )}
      {topFolders.map((folder) => renderFolder(folder, 0))}
      {showCreate === "root" && renderCreateForm(0)}

      {showCreate === null && (
        <button
          type="button"
          onClick={() => {
            setShowCreate("root");
            setNewFolderName("");
          }}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-neutral-800 sm:mt-1"
        >
          + {t("carnet.folders.newFolder")}
        </button>
      )}
    </div>
  );
}
