import { useLanguage } from "../i18n/LanguageContext";

function TargetZoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="8" strokeDasharray="2.5 2.5" />
      <path strokeLinecap="round" d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function WhiteZonesToggle({ active, onToggle }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={t("map.whiteZonesAria")}
      aria-pressed={active}
      title={t("map.whiteZones")}
      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg transition ${
        active
          ? "border-neutral-900 bg-neutral-900 text-amber-200 dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
      }`}
    >
      <TargetZoneIcon />
    </button>
  );
}
