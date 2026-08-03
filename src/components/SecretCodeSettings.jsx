import { useState } from "react";
import { getSecretCode, setSecretCode } from "../utils/storage";

export default function SecretCodeSettings({ onClose }) {
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [message, setMessage] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    if (currentCode !== getSecretCode()) {
      setMessage({ type: "error", text: "Code secret actuel incorrect." });
      return;
    }

    if (!newCode.trim()) {
      setMessage({ type: "error", text: "Le nouveau code ne peut pas être vide." });
      return;
    }

    if (newCode !== confirmCode) {
      setMessage({ type: "error", text: "Les deux nouveaux codes ne correspondent pas." });
      return;
    }

    setSecretCode(newCode.trim());
    setMessage({ type: "success", text: "Code secret mis à jour avec succès." });
    setCurrentCode("");
    setNewCode("");
    setConfirmCode("");
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-900 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Changer le code secret
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Ce code protège le formulaire d'ajout d'avis. Il est stocké
          uniquement sur cet appareil.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-left">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Code secret actuel
            <input
              type="password"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Nouveau code
            <input
              type="password"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Confirmer le nouveau code
            <input
              type="password"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-1.5 text-sm"
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
            className="mt-2 rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
