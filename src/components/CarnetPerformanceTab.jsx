import { useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { computeComparativePerformance } from "../utils/performance";
import PerformanceMetricCard from "./PerformanceMetricCard";

export default function CarnetPerformanceTab({ stores, visitNotes, prospectFirstSeen }) {
  const { t } = useLanguage();
  const storeIds = useMemo(() => stores.map((s) => s.id), [stores]);

  const performance = useMemo(
    () => computeComparativePerformance({ storeIds, visitNotes, prospectFirstSeen }),
    [storeIds, visitNotes, prospectFirstSeen],
  );

  return (
    <div className="max-w-3xl">
      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {t("carnet.perf.weekTitle")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PerformanceMetricCard
            label={t("carnet.perf.visits")}
            current={performance.week.current.visits}
            previous={performance.week.previous.visits}
          />
          <PerformanceMetricCard
            label={t("carnet.perf.newProspects")}
            current={performance.week.current.newProspects}
            previous={performance.week.previous.newProspects}
          />
          <PerformanceMetricCard
            label={t("carnet.perf.coverage")}
            current={performance.week.current.coverageRate}
            previous={performance.week.previous.coverageRate}
            format="percent"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {t("carnet.perf.monthTitle")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PerformanceMetricCard
            label={t("carnet.perf.visits")}
            current={performance.month.current.visits}
            previous={performance.month.previous.visits}
          />
          <PerformanceMetricCard
            label={t("carnet.perf.newProspects")}
            current={performance.month.current.newProspects}
            previous={performance.month.previous.newProspects}
          />
          <PerformanceMetricCard
            label={t("carnet.perf.coverage")}
            current={performance.month.current.coverageRate}
            previous={performance.month.previous.coverageRate}
            format="percent"
          />
        </div>
      </section>

      <p className="mt-8 text-[11px] italic leading-relaxed text-neutral-400 dark:text-neutral-500">
        {t("carnet.perf.methodologyHint")}
      </p>
    </div>
  );
}
