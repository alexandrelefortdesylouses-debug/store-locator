import { STORE_STATUSES } from "../utils/myCard";
import { STATUS_COLORS } from "../utils/palette";
import { useLanguage } from "../i18n/LanguageContext";

const STATUS_ORDER = [
  STORE_STATUSES.ACTIVE_CLIENT,
  STORE_STATUSES.PROSPECT,
  STORE_STATUSES.APPOINTMENT_PENDING,
  STORE_STATUSES.REFUSED,
];

export default function StatusSelector({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("myCard.statusTitle")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_ORDER.map((status) => {
          const active = value === status;
          const color = STATUS_COLORS[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => onChange(active ? null : status)}
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
  );
}
