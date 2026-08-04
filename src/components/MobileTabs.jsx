import { useLanguage } from "../i18n/LanguageContext";

export default function MobileTabs({ view, onChange, resultCount }) {
  const { t } = useLanguage();

  return (
    <div className="flex shrink-0 border-b border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900 md:hidden">
      <div className="flex w-full overflow-hidden rounded-full border border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => onChange("map")}
          className={`flex-1 cursor-pointer py-2.5 text-sm font-medium transition ${
            view === "map"
              ? "bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
              : "bg-white text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
          }`}
        >
          {t("mobile.viewMap")}
        </button>
        <button
          type="button"
          onClick={() => onChange("list")}
          className={`flex-1 cursor-pointer py-2.5 text-sm font-medium transition ${
            view === "list"
              ? "bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
              : "bg-white text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
          }`}
        >
          {t("mobile.viewList")}
          {resultCount > 0 ? ` (${resultCount})` : ""}
        </button>
      </div>
    </div>
  );
}
