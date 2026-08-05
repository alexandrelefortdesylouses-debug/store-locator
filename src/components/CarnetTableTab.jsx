import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { STORE_STATUSES } from "../utils/myCard";
import { STATUS_COLORS } from "../utils/palette";
import StatusDot from "./StatusDot";

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

export default function CarnetTableTab({ stores, statuses, visitNotes, onOpenNote, onScheduleStore }) {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const locale = lang === "en" ? "en-US" : "fr-FR";

  function toggleStatusFilter(status) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function lastContactDate(storeId) {
    const entries = visitNotes[storeId];
    return entries && entries.length > 0 ? entries[0].date : null;
  }

  const rows = useMemo(() => {
    const query = normalize(search.trim());
    return stores
      .filter((store) => {
        if (statusFilter.length > 0 && !statusFilter.includes(statuses[store.id])) return false;
        if (!query) return true;
        const haystack = normalize(`${store.name} ${store.city} ${store.brands.join(" ")}`);
        return haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, search, statusFilter, statuses]);

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
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <th className="px-4 py-3">{t("carnet.table.colName")}</th>
                <th className="px-4 py-3">{t("carnet.table.colCity")}</th>
                <th className="px-4 py-3">{t("carnet.table.colStatus")}</th>
                <th className="px-4 py-3">{t("carnet.table.colLastContact")}</th>
                <th className="px-4 py-3">{t("carnet.table.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((store) => {
                const lastContact = lastContactDate(store.id);
                const status = statuses[store.id];
                return (
                  <tr
                    key={store.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-3 font-serif text-neutral-900 dark:text-neutral-100">
                      {store.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{store.city}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <StatusDot status={status} />
                        <span className="text-xs text-neutral-600 dark:text-neutral-300">
                          {status ? t(`myCard.status.${status}`) : t("myCard.status.none")}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {lastContact ? new Date(lastContact).toLocaleDateString(locale) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenNote(store.id)}
                          className="cursor-pointer rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
                        >
                          {t("carnet.table.actionOpenNote")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onScheduleStore(store)}
                          className="cursor-pointer rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
                        >
                          {t("carnet.table.actionScheduleRdv")}
                        </button>
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
