import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { STORE_STATUSES, PRIORITY_LEVELS, PRIORITY_STARS } from "../utils/myCard";
import { STATUS_COLORS, PRIORITY_COLORS, ACTION_COLORS } from "../utils/palette";
import { FEATURED_BRANDS } from "../utils/brands";
import { getStoreZip, getStoreDeptCode } from "../utils/postalCode";
import { FOLDER_COLORS } from "../utils/folders";
import { GPS_APPS, buildPreferredDirectionsUrl } from "../utils/gpsPrefs";
import FolderAssignModal from "./FolderAssignModal";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

const STATUS_ORDER = [
  STORE_STATUSES.ACTIVE_CLIENT,
  STORE_STATUSES.PROSPECT,
  STORE_STATUSES.APPOINTMENT_PENDING,
  STORE_STATUSES.REFUSED,
];
const STATUS_RANK = Object.fromEntries(STATUS_ORDER.map((s, i) => [s, i]));

const PRIORITY_ORDER = [PRIORITY_LEVELS.HIGH, PRIORITY_LEVELS.MEDIUM, PRIORITY_LEVELS.LOW];
const PRIORITY_RANK = Object.fromEntries(PRIORITY_ORDER.map((p, i) => [p, i]));

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
      />
      <path strokeLinecap="round" d="M9 12h6M9 16h6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h4l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v4a2 2 0 01-2 2A15 15 0 014 6a2 2 0 012-2z"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-7.4-7-12a7 7 0 0114 0c0 4.6-7 12-7 12z"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V6z"
      />
    </svg>
  );
}

// Actions with a `color` render as solid rounded buttons per the "Mon
// Carnet" design system (Note/RDV/Appeler/GPS); the folder-assign action
// has no assigned color in that system and keeps the original neutral
// outline treatment instead.
function IconButton({ onClick, href, external, disabled, label, color, children }) {
  const filledClassName = `flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition ${
    disabled
      ? "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
      : "cursor-pointer hover:brightness-110 hover:shadow-md active:scale-95"
  }`;
  const outlineClassName = `flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
    disabled
      ? "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
      : "cursor-pointer border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
  }`;
  const className = color ? filledClassName : outlineClassName;
  const style = color && !disabled ? { background: color } : undefined;

  if (href && !disabled) {
    return (
      <a
        href={href}
        title={label}
        aria-label={label}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        style={style}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={style}
      className={className}
    >
      {children}
    </button>
  );
}

// Phone numbers in stores.json aren't consistently formatted (some with
// spaces, some without a country code) — strip everything but digits and a
// leading "+" so the tel: link works the same regardless of source format.
function telHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function SortIndicator({ active, direction }) {
  if (!active) return <span className="ml-0.5 inline-block w-2.5 text-neutral-300 dark:text-neutral-600">↕</span>;
  return (
    <span className="ml-0.5 inline-block w-2.5 text-amber-700 dark:text-amber-400">
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path strokeLinecap="round" d="M6 8.5v3a4 4 0 004 4h4a4 4 0 004-4v-.5" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path strokeLinecap="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

// Dropdown offering PDF/Excel export, scoped to either the checked rows
// (when any are checked) or every row currently visible in the table — see
// CarnetTableTab's handleExport for how the scope is resolved into an
// actual store list. Closes on an outside click, same pattern as
// CarnetFolderSidebar's "..." folder menu.
function ExportMenu({ totalCount, selectedCount, onPick }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handlePick(format, scope) {
    setOpen(false);
    setExporting(true);
    try {
      await onPick(format, scope);
    } finally {
      setExporting(false);
    }
  }

  const hasSelection = selectedCount > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={totalCount === 0 || exporting}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
      >
        <ExportIcon />
        {exporting ? t("carnet.export.generating") : t("carnet.export.button")}
      </button>

      {open && (
        <div className="thin-scrollbar absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {hasSelection && (
            <>
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                {t("carnet.export.scopeSelection", { count: selectedCount })}
              </p>
              <button
                type="button"
                onClick={() => handlePick("pdf", "selection")}
                className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("carnet.export.formatPdf")}
              </button>
              <button
                type="button"
                onClick={() => handlePick("xlsx", "selection")}
                className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("carnet.export.formatXlsx")}
              </button>
            </>
          )}
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {t("carnet.export.scopeAll", { count: totalCount })}
          </p>
          <button
            type="button"
            onClick={() => handlePick("pdf", "all")}
            className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t("carnet.export.formatPdf")}
          </button>
          <button
            type="button"
            onClick={() => handlePick("xlsx", "all")}
            className="flex w-full cursor-pointer items-center rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t("carnet.export.formatXlsx")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CarnetTableTab({
  stores,
  statuses,
  onSetStatus,
  priorities,
  onSetPriority,
  onOpenNote,
  onScheduleStore,
  preferredGpsApp = GPS_APPS.GOOGLE,
  routeOrigin = null,
  folders,
  folderMembers,
  onToggleFolderMembership,
  onBulkAddToFolder,
  onCreateFolder,
  onExportFolder,
  onCreateRoute,
  search,
  onSearchChange,
}) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState([]);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [assigningStore, setAssigningStore] = useState(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  function toggleStatusFilter(status) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function handleCreateAndAssign(name, storeIdOrIds) {
    onCreateFolder(name, storeIdOrIds);
    setAssigningStore(null);
    setBulkAssigning(false);
    if (Array.isArray(storeIdOrIds)) setSelectedIds(new Set());
  }

  function toggleRowSelected(storeId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  }

  function handleDragStart(e, storeId) {
    e.dataTransfer.setData("text/plain", storeId);
    e.dataTransfer.effectAllowed = "copy";
  }

  const rows = useMemo(() => {
    function sortValue(store, key) {
      switch (key) {
        case "name":
          return store.name;
        case "city":
          return store.city;
        case "postalCode":
          return getStoreZip(store) || "";
        case "status":
          return STATUS_RANK[statuses[store.id]] ?? STATUS_ORDER.length;
        case "priority":
          return PRIORITY_RANK[priorities[store.id]] ?? PRIORITY_ORDER.length;
        default:
          return "";
      }
    }

    const query = normalize(search.trim());
    const filtered = stores.filter((store) => {
      if (statusFilter.length > 0 && !statusFilter.includes(statuses[store.id])) return false;
      if (!query) return true;
      const haystack = normalize(`${store.name} ${store.city} ${store.brands.join(" ")}`);
      return haystack.includes(query);
    });

    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * direction;
      return String(va).localeCompare(String(vb)) * direction;
    });
  }, [stores, search, statusFilter, statuses, priorities, sort]);

  const allVisibleSelected = rows.length > 0 && rows.every((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) rows.forEach((s) => next.delete(s.id));
      else rows.forEach((s) => next.add(s.id));
      return next;
    });
  }

  // Scope resolution shared by export and route creation: the checked
  // rows when there are any, otherwise every row currently visible in the
  // table (i.e. already narrowed by the active folder/search/status
  // filters) — never the raw unfiltered folder membership, so "export
  // everything" matches what's actually on screen.
  async function handleExportPick(format, scope) {
    const target = scope === "selection" ? rows.filter((s) => selectedIds.has(s.id)) : rows;
    await onExportFolder(format, target);
  }

  function handleCreateRouteClick() {
    const target = selectedIds.size > 0 ? rows.filter((s) => selectedIds.has(s.id)) : rows;
    onCreateRoute(target);
  }

  function SortableTh({ columnKey, children }) {
    return (
      <th className="px-4 py-3">
        <button
          type="button"
          onClick={() => handleSort(columnKey)}
          className="flex cursor-pointer items-center whitespace-nowrap hover:text-amber-700 dark:hover:text-amber-400"
        >
          {children}
          <SortIndicator active={sort.key === columnKey} direction={sort.direction} />
        </button>
      </th>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCreateRouteClick}
          disabled={rows.length === 0}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
        >
          <RouteIcon />
          {selectedIds.size > 0
            ? t("carnet.export.routeSelection", { count: selectedIds.size })
            : t("carnet.export.routeAll", { count: rows.length })}
        </button>
        <ExportMenu totalCount={rows.length} selectedCount={selectedIds.size} onPick={handleExportPick} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("carnet.table.searchPlaceholder")}
          className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => {
            const active = statusFilter.includes(status);
            const color = STATUS_COLORS[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatusFilter(status)}
                aria-pressed={active}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-transparent text-white"
                    : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-neutral-500"
                }`}
                style={active ? { background: color } : undefined}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: active ? "rgba(255,255,255,0.85)" : color }}
                />
                {t(`myCard.status.${status}`)}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <span>{t("carnet.table.selectedCount", { count: selectedIds.size })}</span>
          <button
            type="button"
            onClick={() => setBulkAssigning(true)}
            className="cursor-pointer rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {t("carnet.table.addSelectionToFolder")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="cursor-pointer text-xs text-amber-700 underline decoration-dotted transition hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
          >
            {t("carnet.table.clearSelection")}
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {stores.length === 0 ? t("carnet.table.emptyPortfolio") : t("carnet.table.noMatch")}
        </p>
      ) : (
        <div className="thin-scrollbar overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label={t("carnet.table.selectAllAria")}
                    className="h-4 w-4 cursor-pointer accent-amber-600"
                  />
                </th>
                <SortableTh columnKey="name">{t("carnet.table.colName")}</SortableTh>
                <SortableTh columnKey="city">{t("carnet.table.colCity")}</SortableTh>
                <SortableTh columnKey="postalCode">{t("carnet.table.colPostal")}</SortableTh>
                <th className="px-4 py-3">{t("carnet.table.colBrands")}</th>
                <SortableTh columnKey="status">{t("carnet.table.colStatus")}</SortableTh>
                <SortableTh columnKey="priority">{t("carnet.table.colPriority")}</SortableTh>
                <th className="px-4 py-3">{t("carnet.table.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((store) => {
                const status = statuses[store.id] || "";
                const priority = priorities[store.id] || "";
                const zip = getStoreZip(store);
                const deptCode = getStoreDeptCode(store);
                const storeFolders = folders.filter((f) => (folderMembers[f.id] || []).includes(store.id));
                return (
                  <tr
                    key={store.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, store.id)}
                    className="relative cursor-grab border-b border-neutral-100 transition hover:z-10 hover:bg-amber-50/60 hover:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.15)] last:border-0 active:cursor-grabbing dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(store.id)}
                        onChange={() => toggleRowSelected(store.id)}
                        aria-label={t("carnet.table.selectRowAria", { name: store.name })}
                        className="h-4 w-4 cursor-pointer accent-amber-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-serif text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span>{store.name}</span>
                        {storeFolders.length > 0 && (
                          <span className="flex shrink-0 items-center gap-0.5">
                            {storeFolders.map((f) => (
                              <span
                                key={f.id}
                                title={f.name}
                                className="h-2 w-2 rounded-full"
                                style={{ background: FOLDER_COLORS[f.color] || FOLDER_COLORS.gray }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{store.city}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {zip ? (deptCode ? `${zip} (${deptCode})` : zip) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {store.brands.map((brand) => {
                          const featured = FEATURED_BRANDS.includes(brand);
                          return (
                            <span
                              key={brand}
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                                featured
                                  ? "bg-amber-700 text-white dark:bg-amber-700"
                                  : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {brand}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={(e) => onSetStatus(store.id, e.target.value || null)}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                          status
                            ? ""
                            : "border-neutral-300 bg-transparent text-neutral-500 shadow-none dark:border-neutral-600 dark:text-neutral-400"
                        }`}
                        style={
                          status
                            ? { background: STATUS_COLORS[status], color: "white", borderColor: "transparent" }
                            : undefined
                        }
                      >
                        <option value="">{t("myCard.status.none")}</option>
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {t(`myCard.status.${s}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={priority}
                        onChange={(e) => onSetPriority(store.id, e.target.value || null)}
                        className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
                        style={
                          priority
                            ? { background: PRIORITY_COLORS[priority], color: "white", borderColor: "transparent" }
                            : { borderColor: "#d4d4d4", color: "#57534e" }
                        }
                      >
                        <option value="">{t("carnet.priority.none")}</option>
                        {PRIORITY_ORDER.map((p) => (
                          <option key={p} value={p}>
                            {"★".repeat(PRIORITY_STARS[p])} {t(`carnet.priority.${p}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconButton
                          onClick={() => onOpenNote(store.id)}
                          label={t("carnet.table.actionOpenNote")}
                          color={ACTION_COLORS.note}
                        >
                          <NoteIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => onScheduleStore(store)}
                          label={t("carnet.table.actionScheduleRdv")}
                          color={ACTION_COLORS.rdv}
                        >
                          <CalendarIcon />
                        </IconButton>
                        <IconButton
                          href={store.phone ? telHref(store.phone) : undefined}
                          disabled={!store.phone}
                          label={store.phone ? t("carnet.table.actionCall") : t("carnet.table.actionCallDisabled")}
                          color={ACTION_COLORS.call}
                        >
                          <PhoneIcon />
                        </IconButton>
                        <IconButton
                          href={buildPreferredDirectionsUrl(preferredGpsApp, store, routeOrigin)}
                          external
                          label={t("carnet.table.actionGps")}
                          color={ACTION_COLORS.gps}
                        >
                          <MapPinIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => setAssigningStore(store)}
                          label={t("carnet.table.actionAssignFolder")}
                        >
                          <FolderIcon />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {assigningStore && (
        <FolderAssignModal
          store={assigningStore}
          folders={folders}
          folderMembers={folderMembers}
          onToggleMembership={onToggleFolderMembership}
          onCreateAndAssign={handleCreateAndAssign}
          onClose={() => setAssigningStore(null)}
        />
      )}

      {bulkAssigning && (
        <FolderAssignModal
          storeIds={[...selectedIds]}
          folders={folders}
          folderMembers={folderMembers}
          onBulkAdd={onBulkAddToFolder}
          onCreateAndAssign={handleCreateAndAssign}
          onClose={() => setBulkAssigning(false)}
        />
      )}
    </div>
  );
}
