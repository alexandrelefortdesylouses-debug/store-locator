import { useLanguage } from "../i18n/LanguageContext";

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth={3} />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export default function LocateMeButton({ onLocate, active, loading, error }) {
  const { t } = useLanguage();

  return (
    <div className="absolute right-4 top-4 z-[400] flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onLocate}
        disabled={loading}
        aria-label={t("map.locateMeAria")}
        title={t("map.locateMe")}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-lg transition disabled:cursor-wait ${
          active
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-amber-400 hover:text-amber-700"
        }`}
      >
        {loading ? <SpinnerIcon /> : <TargetIcon />}
      </button>
      {error && (
        <p className="max-w-[220px] rounded-lg border border-red-200 bg-white/95 px-2.5 py-1.5 text-right text-[11px] text-red-600 shadow-md">
          {error}
        </p>
      )}
    </div>
  );
}
