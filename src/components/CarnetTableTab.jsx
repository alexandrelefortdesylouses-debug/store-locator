import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { STORE_STATUSES, PRIORITY_LEVELS, PRIORITY_STARS } from "../utils/myCard";
import { STATUS_COLORS, PRIORITY_COLORS, ACTION_COLORS, URGENCY_COLORS } from "../utils/palette";
import { computeUrgency, URGENCY_LEVELS, URGENCY_RANK } from "../utils/urgency";
import { FEATURED_BRANDS } from "../utils/brands";
import { getStoreDeptCode } from "../utils/postalCode";
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
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
  const filledClassName = `flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition ${
    disabled
      ? "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
      : "cursor-pointer hover:brightness-110 hover:shadow-md active:scale-95"
  }`;
  const outlineClassName = `flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
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

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10.5" r="2" />
      <path strokeLinecap="round" d="M5.5 16c.6-1.8 2-2.5 3.5-2.5s2.9.7 3.5 2.5M14.5 9.5h4M14.5 12.5h4" />
    </svg>
  );
}

// Shows phone/e-mail in clear text on click rather than acting immediately
// (no auto-dial, no auto-mailto) — "Appeler"/mailto/copy are separate,
// deliberate actions inside the popover. Closes on an outside click, same
// pattern as ExportMenu below.
function ContactPopover({ store }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(store.email);
      setCopied(true);
    } catch {
      // Clipboard API unavailable/denied — the e-mail text is still
      // selectable, so copying manually remains possible.
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <IconButton
        onClick={() => setOpen((v) => !v)}
        label={t("carnet.table.actionContact")}
        color={ACTION_COLORS.call}
      >
        <ContactIcon />
      </IconButton>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {t("carnet.contact.phoneLabel")}
          </p>
          {store.phone ? (
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="select-all text-sm text-neutral-800 dark:text-neutral-100">{store.phone}</span>
              <a
                href={telHref(store.phone)}
                className="shrink-0 cursor-pointer rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
              >
                {t("carnet.contact.call")}
              </a>
            </div>
          ) : (
            <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
              {t("carnet.table.actionCallDisabled")}
            </p>
          )}

          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {t("carnet.contact.emailLabel")}
          </p>
          {store.email ? (
            <div className="flex items-center justify-between gap-2">
              <span className="select-all truncate text-sm text-neutral-800 dark:text-neutral-100">
                {store.email}
              </span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="cursor-pointer rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
                >
                  {copied ? t("carnet.contact.copied") : t("carnet.contact.copy")}
                </button>
                <a
                  href={`mailto:${store.email}`}
                  className="cursor-pointer rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
                >
                  {t("carnet.contact.openMail")}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("carnet.contact.noEmail")}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Composite follow-up signal (see utils/urgency.js) — a computed badge,
// never itself editable. "Aucune" (score 0, e.g. an active client visited
// recently, or a store with no data at all) renders as a plain dash rather
// than a colored pill, so the eye is drawn only to rows that actually need
// attention.
function UrgencyBadge({ level }) {
  const { t } = useLanguage();
  if (level === URGENCY_LEVELS.NONE) {
    return <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>;
  }
  const emoji = level === URGENCY_LEVELS.HIGH ? "🔥" : level === URGENCY_LEVELS.MEDIUM ? "⏰" : "🕐";
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
      style={{ background: URGENCY_COLORS[level] }}
    >
      <span className="shrink-0">{emoji}</span>
      <span className="truncate">{t(`carnet.urgency.${level}`)}</span>
    </span>
  );
}

function SortIndicator({ active, direction }) {
  if (!active) return <span className="ml-0.5 inline-block w-2.5 text-neutral-300 dark:text-neutral-600">↕</span>;
  return (
    <span className="ml-0.5 inline-block w-2.5 text-amber-700 dark:text-amber-400">
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9" />
    </svg>
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

const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800";
const MENU_ITEM_DISABLED_CLASS =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-400 dark:text-neutral-600";

// Mobile (<768px) replacement for a table row: the table's fixed-width
// columns simply don't have room to lay out on a phone screen, so below
// md the whole <table> is swapped for a vertical stack of these cards
// instead (see the `md:hidden` / `hidden md:block` split in the main
// render). Same data, same actions — just re-flowed name+city / status+
// brand badges / primary+overflow-menu actions instead of seven columns.
function StoreCard({
  store,
  status,
  priority,
  urgency,
  deptCode,
  storeFolders,
  onSetStatus,
  onSetPriority,
  onOpenNote,
  onScheduleStore,
  preferredGpsApp,
  routeOrigin,
  onAssignFolder,
  onSelectFolder,
  selectionMode,
  selected,
  onToggleSelected,
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={t("carnet.table.selectRowAria", { name: store.name })}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-amber-600"
        />
      )}
      <div className="min-w-0 flex-1">
        {/* Line 1: name + city */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-serif text-sm text-neutral-900 dark:text-neutral-100">{store.name}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {deptCode ? `${store.city} (${deptCode})` : store.city}
            </p>
          </div>
          <UrgencyBadge level={urgency} />
        </div>

        {storeFolders.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {storeFolders.map((f) => {
              const color = FOLDER_COLORS[f.color] || FOLDER_COLORS.gray;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFolder(f.id)}
                  title={t("carnet.folders.badgeAria", { name: f.name })}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition hover:brightness-95"
                  style={{ borderColor: color, color }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="max-w-[100px] truncate">{f.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Line 2: status + priority badges, then brands */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <select
            value={status}
            onChange={(e) => onSetStatus(store.id, e.target.value || null)}
            aria-label={t("carnet.table.colStatus")}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 ${
              status
                ? ""
                : "border-neutral-300 bg-transparent text-neutral-500 shadow-none dark:border-neutral-600 dark:text-neutral-400"
            }`}
            style={
              status ? { background: STATUS_COLORS[status], color: "white", borderColor: "transparent" } : undefined
            }
          >
            <option value="">{t("myCard.status.none")}</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(`myCard.status.${s}`)}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => onSetPriority(store.id, e.target.value || null)}
            aria-label={t("carnet.table.colPriority")}
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
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
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

        {/* Line 3: primary action + "..." menu for the rest */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNote(store.id)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            <NoteIcon />
            {t("carnet.table.actionViewEdit")}
          </button>
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t("carnet.table.moreActions")}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onScheduleStore(store);
                  }}
                  className={MENU_ITEM_CLASS}
                >
                  <CalendarIcon />
                  {t("carnet.table.actionScheduleRdv")}
                </button>
                {store.phone ? (
                  <a href={telHref(store.phone)} className={MENU_ITEM_CLASS}>
                    <PhoneIcon />
                    {t("carnet.table.actionCall")}
                  </a>
                ) : (
                  <span className={MENU_ITEM_DISABLED_CLASS}>
                    <PhoneIcon />
                    {t("carnet.table.actionCallDisabled")}
                  </span>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className={MENU_ITEM_CLASS}>
                    <ContactIcon />
                    {t("carnet.contact.openMail")}
                  </a>
                )}
                <a
                  href={buildPreferredDirectionsUrl(preferredGpsApp, store, routeOrigin)}
                  target="_blank"
                  rel="noreferrer"
                  className={MENU_ITEM_CLASS}
                >
                  <MapPinIcon />
                  {t("carnet.table.actionGps")}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAssignFolder();
                  }}
                  className={MENU_ITEM_CLASS}
                >
                  <FolderIcon />
                  {t("carnet.table.actionAssignFolder")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarnetTableTab({
  stores,
  statuses,
  onSetStatus,
  priorities,
  onSetPriority,
  visitNotes = {},
  onOpenNote,
  onScheduleStore,
  preferredGpsApp = GPS_APPS.GOOGLE,
  routeOrigin = null,
  folders,
  folderMembers,
  onToggleFolderMembership,
  onBulkAddToFolder,
  onCreateAndAssignFolder,
  onSelectFolder,
  onExportFolder,
  onCreateRoute,
  search,
  onSearchChange,
}) {
  const { t, lang } = useLanguage();
  const [statusFilter, setStatusFilter] = useState([]);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [assigningStore, setAssigningStore] = useState(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  // Row checkboxes are hidden by default so the table stays compact and
  // fits the screen width without horizontal scrolling; this toggle is the
  // only way to reveal them (and the header "select all" checkbox) for a
  // multi-select action like bulk folder assignment.
  const [selectionMode, setSelectionMode] = useState(false);

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
    onCreateAndAssignFolder(name, storeIdOrIds);
    setAssigningStore(null);
    setBulkAssigning(false);
    if (Array.isArray(storeIdOrIds)) setSelectedIds(new Set());
  }

  function handleToggleSelectionMode() {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
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

  function lastVisitDate(storeId) {
    const entries = visitNotes[storeId];
    return entries && entries.length > 0 ? entries[0].date : null;
  }

  function storeUrgency(store) {
    return computeUrgency({
      status: statuses[store.id],
      priority: priorities[store.id],
      lastVisitDate: lastVisitDate(store.id),
    });
  }

  const rows = useMemo(() => {
    function sortValue(store, key) {
      switch (key) {
        case "name":
          return store.name;
        case "city":
          return store.city;
        case "status":
          return STATUS_RANK[statuses[store.id]] ?? STATUS_ORDER.length;
        case "priority":
          return PRIORITY_RANK[priorities[store.id]] ?? PRIORITY_ORDER.length;
        case "urgency": {
          const entries = visitNotes[store.id];
          return URGENCY_RANK[
            computeUrgency({
              status: statuses[store.id],
              priority: priorities[store.id],
              lastVisitDate: entries && entries.length > 0 ? entries[0].date : null,
            })
          ];
        }
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
  }, [stores, search, statusFilter, statuses, priorities, sort, visitNotes]);

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

  function SortableTh({ columnKey, width, children }) {
    return (
      <th className={`px-2 py-2 ${width || ""}`}>
        <button
          type="button"
          onClick={() => handleSort(columnKey)}
          className="flex min-w-0 cursor-pointer items-center hover:text-amber-700 dark:hover:text-amber-400"
        >
          <span className="truncate">{children}</span>
          <SortIndicator active={sort.key === columnKey} direction={sort.direction} />
        </button>
      </th>
    );
  }

  // Percentage widths for a table-fixed layout, so the table always fits
  // the available width instead of forcing horizontal scroll — text cells
  // truncate/wrap instead of pushing the table wider. Two sets because the
  // checkbox column only exists in selection mode; the other seven columns
  // are scaled down slightly to make room for it.
  const columnWidths = selectionMode
    ? {
        checkbox: "w-[4%]",
        name: "w-[22%]",
        city: "w-[10%]",
        brands: "w-[17%]",
        status: "w-[13%]",
        priority: "w-[13%]",
        urgency: "w-[9%]",
        actions: "w-[12%]",
      }
    : {
        name: "w-[23%]",
        city: "w-[11%]",
        brands: "w-[18%]",
        status: "w-[14%]",
        priority: "w-[14%]",
        urgency: "w-[9%]",
        actions: "w-[11%]",
      };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleToggleSelectionMode}
          aria-pressed={selectionMode}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium uppercase tracking-wide transition ${
            selectionMode
              ? "border-transparent bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
          }`}
        >
          <SelectIcon />
          {selectionMode ? t("carnet.table.selectButtonActive") : t("carnet.table.selectButton")}
        </button>
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

      {selectionMode && selectedIds.size > 0 && (
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
        <>
          {/* Mobile (<768px): card list instead of the fixed-column table,
              which has no room to lay out seven columns on a phone. */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {rows.map((store) => {
              const storeFolders = folders.filter((f) => (folderMembers[f.id] || []).includes(store.id));
              return (
                <StoreCard
                  key={store.id}
                  store={store}
                  status={statuses[store.id] || ""}
                  priority={priorities[store.id] || ""}
                  urgency={storeUrgency(store)}
                  deptCode={getStoreDeptCode(store)}
                  storeFolders={storeFolders}
                  onSetStatus={onSetStatus}
                  onSetPriority={onSetPriority}
                  onOpenNote={onOpenNote}
                  onScheduleStore={onScheduleStore}
                  preferredGpsApp={preferredGpsApp}
                  routeOrigin={routeOrigin}
                  onAssignFolder={() => setAssigningStore(store)}
                  onSelectFolder={onSelectFolder}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(store.id)}
                  onToggleSelected={() => toggleRowSelected(store.id)}
                />
              );
            })}
          </div>

          <div className="hidden rounded-xl border border-neutral-200 dark:border-neutral-700 md:block">
          <table
            className={`w-full table-fixed border-collapse text-sm ${lang === "en" ? "carnet-table-compact" : ""}`}
          >
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                {selectionMode && (
                  <th className={`px-2 py-2 ${columnWidths.checkbox}`}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label={t("carnet.table.selectAllAria")}
                      className="h-4 w-4 cursor-pointer accent-amber-600"
                    />
                  </th>
                )}
                <SortableTh columnKey="name" width={columnWidths.name}>
                  {t("carnet.table.colName")}
                </SortableTh>
                <SortableTh columnKey="city" width={columnWidths.city}>
                  {t("carnet.table.colCity")}
                </SortableTh>
                <th className={`px-2 py-2 ${columnWidths.brands}`}>{t("carnet.table.colBrands")}</th>
                <SortableTh columnKey="status" width={columnWidths.status}>
                  {t("carnet.table.colStatus")}
                </SortableTh>
                <SortableTh columnKey="priority" width={columnWidths.priority}>
                  {t("carnet.table.colPriority")}
                </SortableTh>
                <SortableTh columnKey="urgency" width={columnWidths.urgency}>
                  {t("carnet.table.colUrgency")}
                </SortableTh>
                <th className={`px-2 py-2 ${columnWidths.actions}`}>{t("carnet.table.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((store) => {
                const status = statuses[store.id] || "";
                const priority = priorities[store.id] || "";
                const deptCode = getStoreDeptCode(store);
                const storeFolders = folders.filter((f) => (folderMembers[f.id] || []).includes(store.id));
                return (
                  <tr
                    key={store.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, store.id)}
                    className="relative cursor-grab border-b border-neutral-100 transition hover:z-10 hover:bg-amber-50/60 hover:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.15)] last:border-0 active:cursor-grabbing dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  >
                    {selectionMode && (
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(store.id)}
                          onChange={() => toggleRowSelected(store.id)}
                          aria-label={t("carnet.table.selectRowAria", { name: store.name })}
                          className="h-4 w-4 cursor-pointer accent-amber-600"
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 font-serif text-neutral-900 dark:text-neutral-100">
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        <span className="w-full truncate">{store.name}</span>
                        {storeFolders.length > 0 && (
                          <span className="flex flex-wrap items-center gap-1">
                            {storeFolders.map((f) => {
                              const color = FOLDER_COLORS[f.color] || FOLDER_COLORS.gray;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectFolder(f.id);
                                  }}
                                  title={t("carnet.folders.badgeAria", { name: f.name })}
                                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-1.5 py-0.5 font-sans text-[10px] font-medium transition hover:brightness-95"
                                  style={{ borderColor: color, color }}
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                                  <span className="max-w-[90px] truncate">{f.name}</span>
                                </button>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-neutral-600 dark:text-neutral-300">
                      <span className="block truncate">
                        {deptCode ? `${store.city} (${deptCode})` : store.city}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
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
                    <td className="px-2 py-2">
                      <select
                        value={status}
                        onChange={(e) => onSetStatus(store.id, e.target.value || null)}
                        className={`w-full cursor-pointer truncate rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 ${
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
                    <td className="px-2 py-2">
                      <select
                        value={priority}
                        onChange={(e) => onSetPriority(store.id, e.target.value || null)}
                        className="w-full cursor-pointer truncate rounded-full border px-2 py-1 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
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
                    <td className="px-2 py-2">
                      <UrgencyBadge level={storeUrgency(store)} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-1">
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
                        <ContactPopover store={store} />
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
        </>
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
