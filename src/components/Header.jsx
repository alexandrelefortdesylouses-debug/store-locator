import DarkModeToggle from "./DarkModeToggle";
import { useLanguage } from "../i18n/LanguageContext";

function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex overflow-hidden rounded-full border border-neutral-700 text-xs uppercase tracking-wide">
      {["fr", "en"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`flex h-8 min-w-8 cursor-pointer items-center justify-center px-2.5 transition ${
            lang === code
              ? "bg-amber-200 text-neutral-900"
              : "text-neutral-300 hover:text-amber-200"
          }`}
          aria-pressed={lang === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export default function Header({ onOpenSettings, onOpenStats }) {
  const { t } = useLanguage();

  return (
    <header className="relative shrink-0 border-b border-neutral-800 bg-neutral-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5 md:px-8">
        <div className="overflow-hidden rounded-lg shadow-md ring-1 ring-amber-200/25">
          <img
            src="/logo-thelios.jpg"
            alt="Thélios — LVMH Eyewear"
            className="block h-9 w-auto sm:h-11"
          />
        </div>

        <div className="hidden text-center lg:block">
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            {t("header.storeLocator")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <LanguageToggle />
          <button
            type="button"
            onClick={onOpenStats}
            aria-label={t("header.stats")}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200 sm:px-4"
          >
            <StatsIcon />
            <span className="hidden sm:inline">{t("header.stats")}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t("header.settings")}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200 sm:px-4"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">{t("header.settings")}</span>
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
