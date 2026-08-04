import { GOLD_ACCENT, NEUTRAL_ACCENT } from "../utils/palette";

export default function RankedBarList({ rows }) {
  if (rows.length === 0) return null;
  const maxValue = rows[0]?.count || 1;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const pct = maxValue > 0 ? (row.count / maxValue) * 100 : 0;
        return (
          <div key={row.label} className="flex items-center gap-3">
            <span
              className="w-28 shrink-0 truncate text-xs text-neutral-600 dark:text-neutral-400 sm:w-36"
              title={row.label}
            >
              {row.label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full min-w-[3px] rounded-full"
                style={{ width: `${pct}%`, background: row.featured ? GOLD_ACCENT : NEUTRAL_ACCENT }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-medium text-neutral-900 dark:text-neutral-100">
              {row.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
