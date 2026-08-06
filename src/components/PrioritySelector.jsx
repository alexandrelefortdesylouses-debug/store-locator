import { PRIORITY_LEVELS, PRIORITY_STARS } from "../utils/myCard";
import { PRIORITY_COLORS } from "../utils/palette";
import { useLanguage } from "../i18n/LanguageContext";

const PRIORITY_ORDER = [PRIORITY_LEVELS.HIGH, PRIORITY_LEVELS.MEDIUM, PRIORITY_LEVELS.LOW];

// Badge size scales with tier (high is visibly the largest/boldest) so the
// hierarchy reads even without color — mirrors PriorityBadge's sizing.
const SIZE_CLASSES = {
  high: "px-3.5 py-2 text-sm",
  medium: "px-3 py-1.5 text-xs",
  low: "px-2.5 py-1 text-[11px]",
};

export default function PrioritySelector({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("myCard.priorityTitle")}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRIORITY_ORDER.map((priority) => {
          const active = value === priority;
          const color = PRIORITY_COLORS[priority];
          const stars = PRIORITY_STARS[priority];
          return (
            <button
              key={priority}
              type="button"
              onClick={() => onChange(active ? null : priority)}
              aria-pressed={active}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border font-medium transition ${
                SIZE_CLASSES[priority]
              } ${
                active
                  ? "border-transparent text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-neutral-500"
              }`}
              style={active ? { background: color } : undefined}
            >
              <span aria-hidden="true" style={active ? undefined : { color }}>
                {"★".repeat(stars)}
              </span>
              {t(`carnet.priority.${priority}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
