import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="4.5" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" stroke="none">
      <path d="M20.5 14.5A8.5 8.5 0 019.5 3.5a.75.75 0 00-1-.94A10 10 0 1021.94 15.5a.75.75 0 00-1.44-1z" />
    </svg>
  );
}

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.toggleAria")}
      aria-pressed={isDark}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
