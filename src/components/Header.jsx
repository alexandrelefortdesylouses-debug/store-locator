import TheliosLogo from "./TheliosLogo";
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
          className={`cursor-pointer px-2.5 py-1 transition ${
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

export default function Header({ onOpenSettings }) {
  const { t } = useLanguage();

  return (
    <header className="relative shrink-0 border-b border-neutral-800 bg-neutral-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <TheliosLogo className="h-9 w-9 text-amber-200" />
          <div className="h-8 w-px bg-neutral-800" />
          <div className="leading-tight">
            <p className="font-serif text-2xl uppercase tracking-[0.3em] text-white">
              Thélios
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-amber-200/70">
              LVMH Eyewear
            </p>
          </div>
        </div>

        <div className="hidden text-center sm:block">
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            {t("header.storeLocator")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            type="button"
            onClick={onOpenSettings}
            className="cursor-pointer rounded-full border border-neutral-700 px-4 py-1.5 text-xs uppercase tracking-wide text-neutral-300 transition hover:border-amber-200/60 hover:text-amber-200"
          >
            {t("header.settings")}
          </button>
        </div>
      </div>
    </header>
  );
}
