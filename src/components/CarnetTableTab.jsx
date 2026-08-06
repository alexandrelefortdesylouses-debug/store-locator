import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { STORE_STATUSES, PRIORITY_LEVELS, PRIORITY_STARS } from "../utils/myCard";
import { STATUS_COLORS, PRIORITY_COLORS } from "../utils/palette";
import { FEATURED_BRANDS } from "../utils/brands";
import { getStoreZip, getStoreDeptCode } from "../utils/postalCode";

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

function IconButton({ onClick, href, disabled, label, children }) {
  const className = `flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
    disabled
      ? "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600"
      : "cursor-pointer border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
  }`;

  if (href && !disabled) {
    return (
      <a href={href} title={label} aria-label={label} className={className}>
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

export default function CarnetTableTab({
  stores,
  statuses,
  onSetStatus,
  priorities,
  onSetPriority,
  visitNotes,
  onOpenNote,
  onScheduleStore,
  onViewOnMap,
}) {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const locale = lang === "en" ? "en-US" : "fr-FR";

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

  function lastContactDate(storeId) {
    const entries = visitNotes[storeId];
    return entries && entries.length > 0 ? entries[0].date : null;
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
        case "lastContact": {
          const entries = visitNotes[store.id];
          return entries && entries.length > 0 ? entries[0].date : "";
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
  }, [stores, search, statusFilter, statuses, priorities, visitNotes, sort]);

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {stores.length === 0 ? t("carnet.table.emptyPortfolio") : t("carnet.table.noMatch")}
        </p>
      ) : (
        <div className="thin-scrollbar overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <SortableTh columnKey="name">{t("carnet.table.colName")}</SortableTh>
                <SortableTh columnKey="city">{t("carnet.table.colCity")}</SortableTh>
                <SortableTh columnKey="postalCode">{t("carnet.table.colPostal")}</SortableTh>
                <th className="px-4 py-3">{t("carnet.table.colBrands")}</th>
                <SortableTh columnKey="status">{t("carnet.table.colStatus")}</SortableTh>
                <SortableTh columnKey="priority">{t("carnet.table.colPriority")}</SortableTh>
                <SortableTh columnKey="lastContact">{t("carnet.table.colLastContact")}</SortableTh>
                <th className="px-4 py-3">{t("carnet.table.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((store) => {
                const lastContact = lastContactDate(store.id);
                const status = statuses[store.id] || "";
                const priority = priorities[store.id] || "";
                const zip = getStoreZip(store);
                const deptCode = getStoreDeptCode(store);
                return (
                  <tr
                    key={store.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-3 font-serif text-neutral-900 dark:text-neutral-100">
                      {store.name}
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
                        className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
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
                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {lastContact ? new Date(lastContact).toLocaleDateString(locale) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton
                          onClick={() => onOpenNote(store.id)}
                          label={t("carnet.table.actionOpenNote")}
                        >
                          <NoteIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => onScheduleStore(store)}
                          label={t("carnet.table.actionScheduleRdv")}
                        >
                          <CalendarIcon />
                        </IconButton>
                        <IconButton
                          href={store.phone ? telHref(store.phone) : undefined}
                          disabled={!store.phone}
                          label={store.phone ? t("carnet.table.actionCall") : t("carnet.table.actionCallDisabled")}
                        >
                          <PhoneIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => onViewOnMap(store.id)}
                          label={t("carnet.table.actionViewOnMap")}
                        >
                          <MapPinIcon />
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
    </div>
  );
}
