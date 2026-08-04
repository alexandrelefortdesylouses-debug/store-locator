import { useMemo } from "react";
import { computeNetworkStats } from "../utils/stats";
import BreakdownBarChart from "./BreakdownBarChart";
import { useLanguage } from "../i18n/LanguageContext";

function StatTile({ label, value, hint, accent }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-1.5 font-serif text-2xl ${accent ? "text-amber-700" : "text-neutral-900"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-neutral-400">{hint}</p>}
    </div>
  );
}

export default function Dashboard({ stores, onClose }) {
  const { t, lang } = useLanguage();
  const stats = useMemo(() => computeNetworkStats(stores), [stores]);
  const locale = lang === "en" ? "en-US" : "fr-FR";
  const formatNumber = (n) => n.toLocaleString(locale);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="font-serif text-xl text-neutral-900">{t("stats.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("stats.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
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

          <div className="mb-4 mt-8 flex items-center gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b45309]" />
              {t("stats.legendThelios")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#57534e]" />
              {t("stats.legendCompetitor")}
            </span>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("stats.byRegion")}
          </h3>
          <div className="mb-8">
            <BreakdownBarChart
              rows={stats.regionBreakdown}
              theliosLabel={t("stats.legendThelios")}
              competitorLabel={t("stats.legendCompetitor")}
            />
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("stats.byCity")}
          </h3>
          <BreakdownBarChart
            rows={stats.cityBreakdown}
            theliosLabel={t("stats.legendThelios")}
            competitorLabel={t("stats.legendCompetitor")}
          />
        </div>
      </div>
    </div>
  );
}
