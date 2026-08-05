import { useLanguage } from "../i18n/LanguageContext";

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3z"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3.75A1.75 1.75 0 017.75 2h8.5A1.75 1.75 0 0118 3.75V21l-6-3.75L6 21V3.75z"
      />
    </svg>
  );
}

function NotebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path strokeLinecap="round" d="M8 3v18M4 8h1M4 12h1M4 16h1" />
    </svg>
  );
}

export default function ViewModeToggle({ mode, onChange }) {
  const { t } = useLanguage();

  const modes = [
    { key: "global", label: t("viewMode.global"), Icon: GlobeIcon },
    { key: "mycard", label: t("viewMode.mycard"), Icon: BookmarkIcon },
    { key: "carnet", label: t("viewMode.carnet"), Icon: NotebookIcon },
  ];

  return (
    <div className="flex shrink-0 justify-center border-b border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex overflow-x-auto overflow-y-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
        {modes.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={mode === key}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition sm:px-4 ${
              mode === key
                ? "bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
                : "text-neutral-500 hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400"
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
