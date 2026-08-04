import { useRef } from "react";
import StatusFilter from "./StatusFilter";
import { useLanguage } from "../i18n/LanguageContext";

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

export default function MyCardPanel({
  portfolioCount,
  favoritesCount,
  importing,
  onImportFile,
  onReset,
  selectedStatuses,
  onToggleStatus,
}) {
  const { t } = useLanguage();
  const inputRef = useRef(null);

  return (
    <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
      <p className="font-serif text-base text-neutral-900 dark:text-neutral-100">{t("myCard.title")}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {t("myCard.description")}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{t("myCard.portfolioCount", { count: portfolioCount })}</span>
        <span aria-hidden>·</span>
        <span>{t("myCard.favoritesCount", { count: favoritesCount })}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
      >
        <ImportIcon />
        {importing ? t("myCard.importing") : t("myCard.importButton")}
      </button>

      {portfolioCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-xs text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
        >
          {t("myCard.resetPortfolio")}
        </button>
      )}

      {onToggleStatus && <StatusFilter selected={selectedStatuses} onToggle={onToggleStatus} />}
    </div>
  );
}
