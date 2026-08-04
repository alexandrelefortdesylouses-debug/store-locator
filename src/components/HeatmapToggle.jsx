import { useLanguage } from "../i18n/LanguageContext";

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.5c1.5 2.5-1.5 3.5-1.5 6 0 1.2 1 2 2 2s2-1 2-2.5c1.5 1 2.5 3 2.5 5a5 5 0 11-10 0c0-3.5 2-5.5 5-10.5z"
      />
    </svg>
  );
}

export default function HeatmapToggle({ active, onToggle }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={t("map.heatmapAria")}
      aria-pressed={active}
      title={t("map.heatmap")}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg transition ${
        active
          ? "border-neutral-900 bg-neutral-900 text-amber-200 dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
      }`}
    >
      <FlameIcon />
    </button>
  );
}
