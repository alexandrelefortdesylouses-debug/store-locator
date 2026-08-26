import { useEffect, useRef, useState } from "react";
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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

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

const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800";

// Mobile (<768px) only: the black Header bar is hidden entirely there (no
// room for a second full-height bar above this one), so its logo and
// action buttons fold into this row instead — the "T" mark on the left,
// and a single "..." menu on the right standing in for Search/Stats/
// Admin/Settings/Sign out. Desktop keeps the original Header bar and this
// component renders exactly as before (no logo, no menu).
export default function ViewModeToggle({
  mode,
  onChange,
  currentUser,
  isAdmin,
  onOpenSettings,
  onOpenStats,
  onOpenAdmin,
  onOpenSearch,
  onSignOut,
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const modes = [
    { key: "global", label: t("viewMode.global"), Icon: GlobeIcon },
    { key: "mycard", label: t("viewMode.mycard"), Icon: BookmarkIcon },
    { key: "carnet", label: t("viewMode.carnet"), Icon: NotebookIcon },
  ];

  function handleMenuPick(action) {
    setMenuOpen(false);
    action();
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900 md:justify-center">
      <div className="shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-amber-200/25 md:hidden">
        <img src="/pwa-icon-512.png" alt="Thélios" className="block h-8 w-8" />
      </div>

      <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-full border border-neutral-300 dark:border-neutral-700 md:flex-none md:max-w-full">
        {modes.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={mode === key}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition sm:px-4 ${
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

      <div ref={menuRef} className="relative shrink-0 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t("header.menu")}
          aria-expanded={menuOpen}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
        >
          <MenuIcon />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <button type="button" onClick={() => handleMenuPick(onOpenSearch)} className={MENU_ITEM_CLASS}>
              <SearchIcon />
              {t("header.search")}
            </button>
            <button type="button" onClick={() => handleMenuPick(onOpenStats)} className={MENU_ITEM_CLASS}>
              <StatsIcon />
              {t("header.stats")}
            </button>
            {isAdmin && (
              <button type="button" onClick={() => handleMenuPick(onOpenAdmin)} className={MENU_ITEM_CLASS}>
                <AdminIcon />
                {t("header.admin")}
              </button>
            )}
            <button type="button" onClick={() => handleMenuPick(onOpenSettings)} className={MENU_ITEM_CLASS}>
              <SettingsIcon />
              {t("header.settings")}
            </button>
            {currentUser && (
              <>
                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                <button type="button" onClick={() => handleMenuPick(onSignOut)} className={MENU_ITEM_CLASS}>
                  <LogoutIcon />
                  {t("header.signOut")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
