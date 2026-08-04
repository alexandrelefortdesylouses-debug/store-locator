import { useLanguage } from "../i18n/LanguageContext";

export default function StoreNotes({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("myCard.notesTitle")}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t("myCard.notesPlaceholder")}
        className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
      />
    </div>
  );
}
