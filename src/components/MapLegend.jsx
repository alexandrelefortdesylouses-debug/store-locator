import { useLanguage } from "../i18n/LanguageContext";
import { GOLD_ACCENT, NEUTRAL_ACCENT, STATUS_COLORS, STATUS_NONE_COLOR } from "../utils/palette";
import { STORE_STATUSES } from "../utils/myCard";

const STATUS_ORDER = [
  STORE_STATUSES.ACTIVE_CLIENT,
  STORE_STATUSES.PROSPECT,
  STORE_STATUSES.APPOINTMENT_PENDING,
  STORE_STATUSES.REFUSED,
];

function LegendRow({ color, label }) {
  return (
    <div className="mt-1.5 flex items-center gap-2 first:mt-0">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
    </div>
  );
}

export default function MapLegend({ viewMode }) {
  const { t } = useLanguage();

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-xl border border-neutral-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      {viewMode === "mycard" ? (
        <>
          {STATUS_ORDER.map((status) => (
            <LegendRow key={status} color={STATUS_COLORS[status]} label={t(`myCard.status.${status}`)} />
          ))}
          <LegendRow color={STATUS_NONE_COLOR} label={t("myCard.status.none")} />
        </>
      ) : (
        <>
          <LegendRow color={GOLD_ACCENT} label={t("map.legendFeatured")} />
          <LegendRow color={NEUTRAL_ACCENT} label={t("map.legendOther")} />
        </>
      )}
    </div>
  );
}
