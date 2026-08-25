import { useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";

const STEPS = [
  { key: "welcome", emoji: "👋" },
  { key: "globalMap", emoji: "🗺️" },
  { key: "myCard", emoji: "📇" },
  { key: "carnet", emoji: "🗂️" },
  { key: "palette", emoji: "🔍" },
];

// A short, centered-modal walkthrough shown once after a rep's first login
// on a device (see utils/onboarding.js) — deliberately not a DOM-highlighting
// tour library (spotlighting real UI elements) since that would need to
// track every layout this app already has across three very different view
// modes; a handful of plain-text steps is simpler to keep correct as the
// app evolves, and still orients a new commercial before they're on their
// own in Carte Globale / Ma Carte / Mon Carnet.
export default function OnboardingTour({ open, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function handleNext() {
    if (isLast) {
      handleClose();
      return;
    }
    setStep((s) => s + 1);
  }

  function handleClose() {
    setStep(0);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="p-6 text-center">
          <p className="mb-3 text-4xl" aria-hidden>
            {current.emoji}
          </p>
          <h2 className="mb-2 font-serif text-lg text-neutral-900 dark:text-neutral-100">
            {t(`onboarding.${current.key}.title`)}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t(`onboarding.${current.key}.body`)}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 w-1.5 rounded-full transition ${
                i === step ? "bg-amber-600 dark:bg-amber-400" : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3.5 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer text-xs text-neutral-400 transition hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
          >
            {t("onboarding.skip")}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="cursor-pointer rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {isLast ? t("onboarding.finish") : t("onboarding.next")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
