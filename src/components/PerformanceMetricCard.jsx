import { useLanguage } from "../i18n/LanguageContext";

export default function PerformanceMetricCard({ label, current, previous, format = "count" }) {
  const { t } = useLanguage();
  const diff = current - previous;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";

  const formattedCurrent = format === "percent" ? `${current.toFixed(0)}%` : current;
  const formattedPrevious = format === "percent" ? `${previous.toFixed(0)}%` : previous;
  const deltaLabel =
    trend === "flat"
      ? "±0"
      : `${diff > 0 ? "+" : ""}${format === "percent" ? `${diff.toFixed(0)} pts` : diff}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="font-serif text-2xl text-neutral-900 dark:text-neutral-100">{formattedCurrent}</p>
        <span
          className={`text-xs font-medium ${
            trend === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {deltaLabel}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
        {t("carnet.perf.vsPrevious", { value: formattedPrevious })}
      </p>
    </div>
  );
}
