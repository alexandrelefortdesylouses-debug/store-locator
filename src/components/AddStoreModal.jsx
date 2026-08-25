import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { upsertStores } from "../services/storesService";
import { buildStoreEntry, geocodeImportedStores, flagDuplicates } from "../utils/adminStoreImport";

const EMPTY_FORM = { name: "", address: "", city: "", postal: "", brands: "", phone: "", email: "", website: "" };

const FIELD_CLASS =
  "rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100";
const LABEL_CLASS = "flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400";

// A single-optician equivalent of the Admin panel's bulk Excel/CSV import
// (src/utils/adminStoreImport.js), reachable directly from "Ma Carte" so a
// rep who finds a new optician in the field isn't blocked waiting for an
// admin to run a spreadsheet import. Reuses the exact same
// geocode-then-upsert pipeline (buildStoreEntry, geocodeImportedStores,
// upsertStores) so a manually-added optician behaves identically to one
// added via Admin — same "local override layered on stores.json" caveat,
// same id scheme.
export default function AddStoreModal({ open, onClose, stores, initialValues, onStoresUpdated, onAdded }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | geocoding | confirmDuplicate
  const [pendingEntry, setPendingEntry] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Re-seeds the form every time the modal opens — from a blank slate by
  // default, or pre-filled when opened with `initialValues` (e.g. a parsed
  // vCard from "Importer une fiche contact"). The form component itself
  // stays mounted between opens (App.jsx never unmounts it), so this can't
  // just be a `useState` initializer.
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, ...initialValues });
      setStatus("idle");
      setPendingEntry(null);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const brandOptions = useMemo(() => [...new Set((stores || []).flatMap((s) => s.brands))].sort(), [stores]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setStatus("idle");
    setPendingEntry(null);
    setErrorMessage(null);
    onClose();
  }

  function finalizeAdd(entry) {
    upsertStores([entry]);
    onStoresUpdated?.();
    onAdded?.(entry.id);
    resetAndClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || status === "geocoding") return;

    setStatus("geocoding");
    setErrorMessage(null);
    const entry = buildStoreEntry({
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postal: form.postal.trim(),
      brandsRaw: form.brands,
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
    });
    const [geocoded] = await geocodeImportedStores([entry]);
    if (geocoded.geocodeFailed) {
      setStatus("idle");
      setErrorMessage(t("addStore.geocodeFailed"));
      return;
    }

    const [flagged] = flagDuplicates([geocoded], stores || []);
    if (flagged.duplicateOfId) {
      setPendingEntry(flagged);
      setStatus("confirmDuplicate");
      return;
    }
    finalizeAdd(geocoded);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">{t("addStore.title")}</h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label={t("myCard.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("addStore.hint")}
          </p>

          {status === "confirmDuplicate" && pendingEntry ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <p className="mb-3 text-amber-800 dark:text-amber-300">
                {t("addStore.duplicateWarning", { name: pendingEntry.duplicateOfName })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setPendingEntry(null);
                  }}
                  className="flex-1 cursor-pointer rounded-full border border-neutral-300 px-3 py-2 text-xs text-neutral-600 transition hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300"
                >
                  {t("addStore.duplicateCancel")}
                </button>
                <button
                  type="button"
                  onClick={() => finalizeAdd(pendingEntry)}
                  className="flex-1 cursor-pointer rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
                >
                  {t("addStore.duplicateConfirm")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className={LABEL_CLASS}>
                {t("addStore.fieldName")}
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={FIELD_CLASS}
                />
              </label>
              <label className={LABEL_CLASS}>
                {t("addStore.fieldAddress")}
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={FIELD_CLASS}
                />
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 ${LABEL_CLASS}`}>
                  {t("addStore.fieldCity")}
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className={`w-28 shrink-0 ${LABEL_CLASS}`}>
                  {t("addStore.fieldPostal")}
                  <input
                    value={form.postal}
                    onChange={(e) => updateField("postal", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
              </div>
              <label className={LABEL_CLASS}>
                {t("addStore.fieldBrands")}
                <input
                  list="add-store-brands"
                  value={form.brands}
                  onChange={(e) => updateField("brands", e.target.value)}
                  placeholder={t("addStore.fieldBrandsPlaceholder")}
                  className={FIELD_CLASS}
                />
                <datalist id="add-store-brands">
                  {brandOptions.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </label>
              <div className="flex gap-2">
                <label className={`flex-1 ${LABEL_CLASS}`}>
                  {t("addStore.fieldPhone")}
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className={`flex-1 ${LABEL_CLASS}`}>
                  {t("addStore.fieldEmail")}
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
              </div>
              <label className={LABEL_CLASS}>
                {t("addStore.fieldWebsite")}
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  className={FIELD_CLASS}
                />
              </label>

              {errorMessage && <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>}

              <button
                type="submit"
                disabled={status === "geocoding" || !form.name.trim() || !form.city.trim()}
                className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
              >
                {status === "geocoding" ? t("addStore.geocoding") : t("addStore.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
