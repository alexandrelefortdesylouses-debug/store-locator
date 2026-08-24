import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { getFolders } from "../utils/folders";
import { getRecentSearches, addRecentSearch } from "../utils/recentSearches";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase();
}

const MAX_STORE_RESULTS = 6;
const MAX_FOLDER_RESULTS = 4;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

// A global Cmd/Ctrl+K "go to" palette — searches across the whole store
// network and Mon Carnet's folder tree, plus a handful of navigation
// shortcuts, so a rep doesn't have to know which view/tab something lives
// in to jump straight to it. Folders are read straight from localStorage
// via getFolders() rather than threaded down as a prop: they're already
// per-device data with no other consumer at the App.jsx level, and
// re-reading on open keeps this component decoupled from CarnetView's
// internal state tree.
export default function CommandPalette({ open, onClose, stores, onOpenStore, onOpenFolder, onNavigate }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef(null);
  const folders = useMemo(() => (open ? getFolders() : []), [open]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setHighlightIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  const quickActions = useMemo(
    () => [
      { type: "action", id: "global", label: t("commandPalette.actionGlobal"), run: () => onNavigate("global") },
      { type: "action", id: "mycard", label: t("commandPalette.actionMyCard"), run: () => onNavigate("mycard") },
      { type: "action", id: "carnet", label: t("commandPalette.actionCarnet"), run: () => onNavigate("carnet") },
      { type: "action", id: "settings", label: t("commandPalette.actionSettings"), run: () => onNavigate("settings") },
      { type: "action", id: "stats", label: t("commandPalette.actionStats"), run: () => onNavigate("stats") },
    ],
    [t, onNavigate],
  );

  // Only type+id are persisted (see recentSearches.js) — re-resolved here
  // against the live stores/folders lists so a rename or a since-deleted
  // folder is never shown stale, and simply drops out if it no longer
  // exists.
  const recentResults = useMemo(() => {
    if (!open) return [];
    return getRecentSearches()
      .map((r) => {
        if (r.type === "store") {
          const store = stores.find((s) => s.id === r.id);
          return store
            ? { type: "store", id: store.id, label: store.name, sub: store.city, run: () => onOpenStore(store.id) }
            : null;
        }
        const folder = folders.find((f) => f.id === r.id);
        return folder
          ? {
              type: "folder",
              id: folder.id,
              label: folder.name,
              sub: t("commandPalette.folderSub"),
              run: () => onOpenFolder(folder.id),
            }
          : null;
      })
      .filter(Boolean);
  }, [open, stores, folders, onOpenStore, onOpenFolder, t]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [...recentResults, ...quickActions];

    const storeResults = stores
      .filter((s) => normalize(`${s.name} ${s.city}`).includes(q))
      .slice(0, MAX_STORE_RESULTS)
      .map((s) => ({ type: "store", id: s.id, label: s.name, sub: s.city, run: () => onOpenStore(s.id) }));

    const folderResults = folders
      .filter((f) => normalize(f.name).includes(q))
      .slice(0, MAX_FOLDER_RESULTS)
      .map((f) => ({
        type: "folder",
        id: f.id,
        label: f.name,
        sub: t("commandPalette.folderSub"),
        run: () => onOpenFolder(f.id),
      }));

    const actionResults = quickActions.filter((a) => normalize(a.label).includes(q));

    return [...storeResults, ...folderResults, ...actionResults];
  }, [query, stores, folders, quickActions, recentResults, onOpenStore, onOpenFolder, t]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  function handleSelect(item) {
    if (item.type === "store" || item.type === "folder") {
      addRecentSearch(item.type, item.id);
    }
    item.run();
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = results[highlightIndex];
      if (item) handleSelect(item);
    }
  }

  // Section headers ("Récents" / "Navigation") only make sense for the
  // empty-query view where recents and quick actions sit next to each
  // other — once a query is typed, results is a normal ranked search list.
  const showSectionHeaders = !query.trim() && recentResults.length > 0;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1500] flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("commandPalette.placeholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 focus:outline-none dark:text-neutral-100"
          />
          <kbd className="hidden shrink-0 rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:border-neutral-600 dark:text-neutral-500 sm:block">
            Esc
          </kbd>
        </div>

        <div className="thin-scrollbar max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {t("commandPalette.noResults")}
            </p>
          ) : (
            results.map((item, i) => (
              <div key={`${item.type}-${item.id}`}>
                {showSectionHeaders && i === 0 && (
                  <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    {t("commandPalette.recentLabel")}
                  </p>
                )}
                {showSectionHeaders && i === recentResults.length && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    {t("commandPalette.navLabel")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left transition ${
                    i === highlightIndex ? "bg-amber-50 dark:bg-neutral-800" : ""
                  }`}
                >
                  <span className="shrink-0 text-base">
                    {item.type === "store" ? "👓" : item.type === "folder" ? "📁" : "→"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-neutral-800 dark:text-neutral-100">
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">
                        {item.sub}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
