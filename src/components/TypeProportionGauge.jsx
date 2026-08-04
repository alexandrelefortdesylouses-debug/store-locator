import { GOLD_ACCENT, NEUTRAL_ACCENT, SILVER_ACCENT } from "../utils/palette";
import { STORE_TYPES } from "../utils/storeType";
import { useLanguage } from "../i18n/LanguageContext";

const COLORS = {
  [STORE_TYPES.FLAGSHIP]: GOLD_ACCENT,
  [STORE_TYPES.DEPARTMENT_STORE]: SILVER_ACCENT,
  [STORE_TYPES.INDEPENDENT]: NEUTRAL_ACCENT,
};

export default function TypeProportionGauge({ rows }) {
  const { t } = useLanguage();
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return (
      <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
        {t("stats.noData")}
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        {rows.map(
          (row) =>
            row.count > 0 && (
              <div
                key={row.type}
                className="h-full"
                style={{ width: `${row.pct}%`, background: COLORS[row.type] }}
                title={`${t(`storeType.${row.type}`)}: ${row.count}`}
              />
            ),
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.type}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[row.type] }}
              />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {t(`storeType.${row.type}`)}
              </span>
            </div>
            <p className="mt-1.5 font-serif text-xl text-neutral-900 dark:text-neutral-100">
              {row.count}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{row.pct.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
