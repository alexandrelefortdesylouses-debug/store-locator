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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-neutral-900">
            Changer le code secret
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-neutral-400 hover:text-neutral-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-neutral-500">
          Ce code protège le formulaire d'ajout d'avis. Il est stocké
          uniquement sur cet appareil.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-left">
          <label className="text-sm text-neutral-700">
            Code secret actuel
            <input
              type="password"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>
          <label className="text-sm text-neutral-700">
            Nouveau code
            <input
              type="password"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>
          <label className="text-sm text-neutral-700">
            Confirmer le nouveau code
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
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
