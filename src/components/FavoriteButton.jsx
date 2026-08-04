import { useLanguage } from "../i18n/LanguageContext";

export default function FavoriteButton({ active, onToggle, className = "" }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      aria-label={active ? t("myCard.removeFavorite") : t("myCard.addFavorite")}
      title={active ? t("myCard.removeFavorite") : t("myCard.addFavorite")}
      className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition ${
        active
          ? "text-rose-500 dark:text-rose-400"
          : "text-current opacity-40 hover:text-rose-400 hover:opacity-100"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4.5 w-4.5"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.7-4.35-9.3-8.2C.86 9.94 1.8 6.6 4.6 5.28c2.29-1.08 4.7-.2 6.1 1.6a.4.4 0 00.6 0c1.4-1.8 3.81-2.68 6.1-1.6 2.8 1.32 3.74 4.66 1.9 7.52C18.7 16.65 12 21 12 21z"
        />
      </svg>
    </button>
  );
}
