import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { findWhitelistEntry, setPassword, ROLES } from "../services/authService";
import { STATUS_COLORS } from "../utils/palette";
import { STORE_STATUSES } from "../utils/myCard";

const TABS = ["account", "preferences", "help"];
const FAQ_STATUS_ORDER = [
  STORE_STATUSES.ACTIVE_CLIENT,
  STORE_STATUSES.PROSPECT,
  STORE_STATUSES.APPOINTMENT_PENDING,
  STORE_STATUSES.REFUSED,
];

function LanguageSection() {
  const { t, lang, setLang } = useLanguage();
  return (
    <div className="mb-8">
      <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("settingsPanel.languageTitle")}
      </h3>
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        {t("settingsPanel.languageHint")}
      </p>
      <div className="flex gap-2">
        {["fr", "en"].map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-wide transition ${
              lang === code
                ? "border-transparent bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
                : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
            }`}
          >
            {code === "fr" ? t("settingsPanel.languageFr") : t("settingsPanel.languageEn")}
          </button>
        ))}
      </div>
    </div>
  );
}

function DarkModeSection() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  return (
    <div className="mb-8">
      <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("settingsPanel.darkModeTitle")}
      </h3>
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        {t("settingsPanel.darkModeHint")}
      </p>
      <div className="flex gap-2">
        {["light", "dark"].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-pressed={theme === mode}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-wide transition ${
              theme === mode
                ? "border-transparent bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
                : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
            }`}
          >
            {mode === "light" ? t("settingsPanel.themeLight") : t("settingsPanel.themeDark")}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChangePasswordSection({ currentUser }) {
  const { t } = useLanguage();
  const [hasPassword, setHasPassword] = useState(
    () => Boolean(findWhitelistEntry(currentUser.email)?.password),
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    if (!newPassword.trim()) {
      setMessage({ type: "error", text: t("account.errorEmptyNew") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("account.errorMismatch") });
      return;
    }

    const { ok, error } = setPassword(currentUser.email, currentPassword, newPassword.trim());
    if (error === "wrong-current") {
      setMessage({ type: "error", text: t("account.errorWrongCurrent") });
      return;
    }
    if (!ok) {
      setMessage({ type: "error", text: t("account.errorGeneric") });
      return;
    }

    setHasPassword(true);
    setMessage({ type: "success", text: t("account.success") });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div>
      <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("account.passwordTitle")}
      </h3>
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        {hasPassword ? t("account.passwordHint") : t("account.passwordHintFirstTime")}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {hasPassword && (
          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            {t("account.currentPassword")}
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />
          </label>
        )}
        <label className="text-sm text-neutral-700 dark:text-neutral-300">
          {t("account.newPassword")}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
          />
        </label>
        <label className="text-sm text-neutral-700 dark:text-neutral-300">
          {t("account.confirmPassword")}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
          />
        </label>

        {message && (
          <p
            className={`text-sm ${
              message.type === "error" ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 w-fit cursor-pointer rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
        >
          {t("account.save")}
        </button>
      </form>
    </div>
  );
}

function AccountSection({ currentUser, onSignOut }) {
  const { t } = useLanguage();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <div>
      <h3 className="mb-3 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("account.profileTitle")}
      </h3>
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">{t("account.emailLabel")}</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{currentUser.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">{t("account.roleLabel")}</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {currentUser.role === ROLES.ADMIN ? t("admin.roleAdmin") : t("admin.roleCommercial")}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPasswordForm((v) => !v)}
        aria-expanded={showPasswordForm}
        className={`cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400 ${
          showPasswordForm ? "mb-4" : "mb-8"
        }`}
      >
        {showPasswordForm ? t("account.cancelPasswordChange") : t("account.changePasswordButton")}
      </button>

      {showPasswordForm && (
        <div className="mb-8">
          <ChangePasswordSection currentUser={currentUser} />
        </div>
      )}

      <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-700">
        <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
          {t("settingsPanel.sessionTitle")}
        </h3>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t("settingsPanel.sessionHint")}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="cursor-pointer rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          {t("header.signOut")}
        </button>
      </div>
    </div>
  );
}

function FaqSection() {
  const { t } = useLanguage();
  const faqItems = [
    "importFormat",
    "exportData",
    "geocodeFailure",
    "folders",
    "wrongRegion",
    "endOfDayReport",
    "offlineUsage",
    "passwordSecurity",
    "addToRoute",
    "visitNote",
  ];

  return (
    <div>
      <h3 className="mb-3 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("settingsPanel.faqStatusTitle")}
      </h3>
      <ul className="mb-8 flex flex-col gap-2">
        {FAQ_STATUS_ORDER.map((status) => (
          <li
            key={status}
            className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STATUS_COLORS[status] }}
            />
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t(`myCard.status.${status}`)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t(`settingsPanel.faqStatusDesc.${status}`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mb-3 font-serif text-base text-neutral-900 dark:text-neutral-100">
        {t("settingsPanel.faqGuideTitle")}
      </h3>
      <ul className="flex flex-col gap-3">
        {faqItems.map((key) => (
          <li key={key}>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t(`settingsPanel.faqGuide.${key}.q`)}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t(`settingsPanel.faqGuide.${key}.a`)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPanel({ currentUser, onClose, onSignOut }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("account");

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
            {t("settingsPanel.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("settings.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-neutral-200 px-5 pt-3 dark:border-neutral-700">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`cursor-pointer rounded-t-lg px-3.5 py-2 text-xs font-medium uppercase tracking-wide transition ${
                tab === key
                  ? "border-b-2 border-amber-600 text-neutral-900 dark:text-amber-400"
                  : "text-neutral-500 hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400"
              }`}
            >
              {t(`settingsPanel.tab.${key}`)}
            </button>
          ))}
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "account" && <AccountSection currentUser={currentUser} onSignOut={onSignOut} />}
          {tab === "preferences" && (
            <>
              <LanguageSection />
              <DarkModeSection />
            </>
          )}
          {tab === "help" && <FaqSection />}
        </div>
      </div>
    </div>
  );
}
