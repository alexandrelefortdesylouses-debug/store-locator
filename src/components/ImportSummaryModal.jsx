import { useLanguage } from "../i18n/LanguageContext";

export default function ImportSummaryModal({ result, onClose }) {
  const { t } = useLanguage();
  if (!result) return null;

  const { matchedCount, totalRows, unmatched, error } = result;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
            {t("myCard.importSummaryTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("myCard.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar overflow-y-auto p-5">
          {error ? (
            <>
              <p className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
                {t("myCard.importErrorTitle")}
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t("myCard.importError")}
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-2xl text-neutral-900 dark:text-neutral-100">
                {t("myCard.importSummaryCount", { matched: matchedCount, total: totalRows })}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t("myCard.importSummaryHint")}
              </p>

              {unmatched.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {t("myCard.unmatchedTitle", { count: unmatched.length })}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {unmatched.map((row, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {row.name || t("myCard.unnamedRow")}
                        {row.city ? ` — ${row.city}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {t("myCard.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
