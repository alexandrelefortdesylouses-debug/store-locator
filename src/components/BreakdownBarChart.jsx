import { GOLD_ACCENT, NEUTRAL_ACCENT } from "../utils/palette";

const THELIOS_COLOR = GOLD_ACCENT;
const COMPETITOR_COLOR = NEUTRAL_ACCENT;

function BarRow({ label, thelios, competitor, total, maxTotal, theliosLabel, competitorLabel }) {
  const theliosPct = maxTotal > 0 ? (thelios / maxTotal) * 100 : 0;
  const competitorPct = maxTotal > 0 ? (competitor / maxTotal) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-28 shrink-0 truncate text-xs text-neutral-600 dark:text-neutral-400 sm:w-36"
        title={label}
      >
        {label}
      </span>
      <div className="flex h-3 flex-1 items-center gap-0.5">
        {thelios > 0 && (
          <div
            className="h-full min-w-[3px] rounded-full"
            style={{ width: `${theliosPct}%`, background: THELIOS_COLOR }}
            title={`${label} — ${theliosLabel}: ${thelios}`}
          />
        )}
        {competitor > 0 && (
          <div
            className="h-full min-w-[3px] rounded-full"
            style={{ width: `${competitorPct}%`, background: COMPETITOR_COLOR }}
            title={`${label} — ${competitorLabel}: ${competitor}`}
          />
        )}
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-neutral-900 dark:text-neutral-100">
        {total}
      </span>
    </div>
  );
}

export default function BreakdownBarChart({ rows, theliosLabel, competitorLabel }) {
  if (rows.length === 0) return null;
  const maxTotal = rows[0]?.total || 1;

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <BarRow
          key={row.label}
          {...row}
          maxTotal={maxTotal}
          theliosLabel={theliosLabel}
          competitorLabel={competitorLabel}
        />
      ))}
    </div>
  );
}
