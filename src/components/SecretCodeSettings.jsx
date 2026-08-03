import { useState } from "react";
import { getSecretCode, setSecretCode } from "../utils/storage";
import { useLanguage } from "../i18n/LanguageContext";

export default function SecretCodeSettings({ onClose }) {
  const { t } = useLanguage();
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [message, setMessage] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    if (currentCode !== getSecretCode()) {
      setMessage({ type: "error", text: t("settings.errorWrongCurrent") });
      return;
    }

    if (!newCode.trim()) {
      setMessage({ type: "error", text: t("settings.errorEmptyNew") });
      return;
    }

    if (newCode !== confirmCode) {
      setMessage({ type: "error", text: t("settings.errorMismatch") });
      return;
    }

    setSecretCode(newCode.trim());
    setMessage({ type: "success", text: t("settings.success") });
    setCurrentCode("");
    setNewCode("");
    setConfirmCode("");
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-neutral-900">
            {t("settings.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-neutral-400 hover:text-neutral-700"
            aria-label={t("settings.close")}
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-neutral-500">
          {t("settings.description")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-left">
          <label className="text-sm text-neutral-700">
            {t("settings.currentCode")}
            <input
              type="password"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>
          <label className="text-sm text-neutral-700">
            {t("settings.newCode")}
            <input
              type="password"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>
          <label className="text-sm text-neutral-700">
            {t("settings.confirmCode")}
            <input
              type="password"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>

          {message && (
            <p
              className={`text-sm ${
                message.type === "error" ? "text-red-500" : "text-green-600"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 cursor-pointer rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            {t("settings.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
