import { useLanguage } from "../i18n/LanguageContext";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
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

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.4-2.9 8.4-7 9.7C7.9 19.4 5 15.4 5 11V6l7-3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function Header({
  currentUser,
  isAdmin,
  onOpenSettings,
  onOpenStats,
  onOpenAdmin,
  onOpenSearch,
  onSignOut,
}) {
  const { t } = useLanguage();

  return (
    <header className="relative hidden shrink-0 border-b border-neutral-800 bg-neutral-950 md:block">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
      <div className="flex flex-nowrap items-center justify-between gap-2 px-2 py-2.5 sm:px-5 sm:py-3 md:px-8">
        <div className="shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-amber-200/25">
          <img
            src="/pwa-icon-512.png"
            alt="Thélios"
            className="block h-9 w-9 sm:h-11 sm:w-11"
          />
        </div>

        <div className="hidden text-center lg:block">
          <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            {t("header.storeLocator")}
          </p>
        </div>

        <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={t("header.search")}
            title={t("header.searchHint")}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200 sm:px-4"
          >
            <SearchIcon />
            <span className="hidden sm:inline">{t("header.search")}</span>
            <kbd className="hidden rounded border border-neutral-700 px-1 text-[10px] normal-case text-neutral-500 lg:inline">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onOpenStats}
            aria-label={t("header.stats")}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200 sm:px-4"
          >
            <StatsIcon />
            <span className="hidden sm:inline">{t("header.stats")}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-label={t("header.admin")}
              className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-700/60 px-2.5 text-xs uppercase tracking-wide text-amber-300 transition hover:border-amber-400 hover:text-amber-200 sm:px-4"
            >
              <AdminIcon />
              <span className="hidden sm:inline">{t("header.admin")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t("header.settings")}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200 sm:px-4"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">{t("header.settings")}</span>
          </button>
          {currentUser && (
            <button
              type="button"
              onClick={onSignOut}
              title={currentUser.email}
              aria-label={t("header.signOut")}
              className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-2.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-red-400/60 hover:text-red-300"
            >
              <LogoutIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
