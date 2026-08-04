import { useMemo, useState } from "react";
import { computeNetworkStats } from "../utils/stats";
import BreakdownBarChart from "./BreakdownBarChart";
import RankedBarList from "./RankedBarList";
import TypeProportionGauge from "./TypeProportionGauge";
import { useLanguage } from "../i18n/LanguageContext";
import { GOLD_ACCENT, NEUTRAL_ACCENT } from "../utils/palette";

const VIEWS = ["geo", "brand", "type", "city"];

function StatTile({ label, value, hint, accent }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-1.5 font-serif text-2xl ${accent ? "text-amber-700 dark:text-amber-400" : "text-neutral-900 dark:text-neutral-100"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-neutral-400 dark:text-neutral-500">{hint}</p>}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function Dashboard({ stores, isFiltered, onClose }) {
  const { t, lang } = useLanguage();
  const [view, setView] = useState("geo");
  const stats = useMemo(() => computeNetworkStats(stores), [stores]);
  const locale = lang === "en" ? "en-US" : "fr-FR";
  const formatNumber = (n) => n.toLocaleString(locale);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div>
            <h2 className="font-serif text-xl text-neutral-900 dark:text-neutral-100">{t("stats.title")}</h2>
            <p className="mt-0.5 text-xs italic text-neutral-400 dark:text-neutral-500">
              {t(isFiltered ? "stats.scopeActive" : "stats.scopeAll", { count: stats.total })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("stats.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label={t("stats.totalOpticians")}
              value={formatNumber(stats.total)}
            />
            <StatTile
              label={t("stats.penetrationRate")}
              value={`${stats.penetrationRate.toFixed(1)}%`}
              hint={t("stats.penetrationHint")}
              accent
            />
            <StatTile
              label={t("stats.theliosOpticians")}
              value={formatNumber(stats.thelios)}
            />
            <StatTile
              label={t("stats.competitorOpticians")}
              value={formatNumber(stats.competitorOnly)}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: GOLD_ACCENT }} />
                {t("stats.legendThelios")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEUTRAL_ACCENT }} />
                {t("stats.legendCompetitor")}
              </span>
            </div>

            <div className="relative">
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-full border border-neutral-300 bg-white py-2 pl-4 pr-9 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 sm:w-80"
              >
                {VIEWS.map((key) => (
                  <option key={key} value={key}>
                    {t(`stats.view.${key}`)}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          <div className="mt-6">
            {view === "geo" && (
              <>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("stats.byRegion")}
                </h3>
                {stats.regionBreakdown.length > 0 ? (
                  <BreakdownBarChart
                    rows={stats.regionBreakdown}
                    theliosLabel={t("stats.legendThelios")}
                    competitorLabel={t("stats.legendCompetitor")}
                  />
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("stats.noData")}</p>
                )}

                <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("stats.byDepartment")}
                </h3>
                {stats.departmentBreakdown.length > 0 ? (
                  <BreakdownBarChart
                    rows={stats.departmentBreakdown}
                    theliosLabel={t("stats.legendThelios")}
                    competitorLabel={t("stats.legendCompetitor")}
                  />
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("stats.noData")}</p>
                )}
              </>
            )}

            {view === "brand" && (
              <>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("stats.view.brand")}
                </h3>
                {stats.brandBreakdown.length > 0 ? (
                  <RankedBarList rows={stats.brandBreakdown} />
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("stats.noData")}</p>
                )}
              </>
            )}

            {view === "type" && (
              <>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("stats.view.type")}
                </h3>
                <TypeProportionGauge rows={stats.typeBreakdown} />
              </>
            )}

            {view === "city" && (
              <>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("stats.byCity")}
                </h3>
                {stats.cityBreakdown.length > 0 ? (
                  <BreakdownBarChart
                    rows={stats.cityBreakdown}
                    theliosLabel={t("stats.legendThelios")}
                    competitorLabel={t("stats.legendCompetitor")}
                  />
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("stats.noData")}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
