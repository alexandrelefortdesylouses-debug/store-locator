import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { signIn, DEFAULT_ADMIN_EMAIL } from "../services/authService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ onSignedIn }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t("login.errorInvalidFormat"));
      return;
    }
    const { user, error: signInError } = signIn(trimmed);
    if (signInError) {
      setError(t("login.errorNotWhitelisted"));
      return;
    }
    setError(null);
    onSignedIn(user);
  }

  // Bypasses typing an email for local demos/QA: signs in directly as the
  // default admin (always whitelisted, see authService.local.js). Purely a
  // convenience shortcut on top of the same local-simulation signIn() —
  // not a separate access path.
  function handleQuickTestLogin() {
    const { user } = signIn(DEFAULT_ADMIN_EMAIL);
    if (user) onSignedIn(user);
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="overflow-hidden rounded-lg shadow-md ring-1 ring-amber-200/25">
            <img src="/logo-thelios.jpg" alt="Thélios — LVMH Eyewear" className="block h-11 w-auto" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            {t("header.storeLocator")}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
          <h1 className="mb-1 font-serif text-lg text-neutral-100">{t("login.title")}</h1>
          <p className="mb-5 text-xs leading-relaxed text-neutral-400">{t("login.description")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {t("login.emailLabel")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@thelios.com"
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-100 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              className="mt-1 cursor-pointer rounded-full bg-amber-600 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-amber-500"
            >
              {t("login.submitButton")}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">{t("login.or")}</span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          <button
            type="button"
            onClick={handleQuickTestLogin}
            className="w-full cursor-pointer rounded-full border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-amber-500/60 hover:text-amber-200"
          >
            {t("login.quickTestButton")}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-600">
          {t("login.localOnlyNote")}
        </p>
      </div>
    </div>
  );
}
