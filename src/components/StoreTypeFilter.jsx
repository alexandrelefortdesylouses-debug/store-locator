import { STORE_TYPES } from "../utils/storeType";
import { useLanguage } from "../i18n/LanguageContext";

const TYPE_ORDER = [
  STORE_TYPES.FLAGSHIP,
  STORE_TYPES.DEPARTMENT_STORE,
  STORE_TYPES.INDEPENDENT,
];

export default function StoreTypeFilter({ selected, onToggle }) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {TYPE_ORDER.map((type) => {
          const active = selected.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
                  : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
              }`}
            >
              {t(`storeType.${type}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
