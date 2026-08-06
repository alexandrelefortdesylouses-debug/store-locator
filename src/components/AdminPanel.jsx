import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import {
  ROLES,
  getWhitelist,
  addWhitelistEntry,
  removeWhitelistEntry,
  setRole,
} from "../services/authService";
import { getOverrides, upsertStores, removeOverride } from "../services/storesService";
import { parseSpreadsheetFile } from "../utils/fileParsing";
import { detectImportColumns, parseImportRows, geocodeImportedStores } from "../utils/adminStoreImport";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminPanel({ currentUser, onStoresUpdated, onClose }) {
  const { t } = useLanguage();
  const [whitelist, setWhitelist] = useState(() => getWhitelist());
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState(ROLES.COMMERCIAL);
  const [whitelistError, setWhitelistError] = useState(null);

  const [overrides, setOverrides] = useState(() => getOverrides());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  function handleAddWhitelist(e) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setWhitelistError(t("admin.errorInvalidEmail"));
      return;
    }
    setWhitelist(addWhitelistEntry(email, newRole));
    setNewEmail("");
    setNewRole(ROLES.COMMERCIAL);
    setWhitelistError(null);
  }

  function handleRemoveWhitelist(email) {
    const { list, error } = removeWhitelistEntry(email);
    setWhitelist(list);
    setWhitelistError(error === "last-admin" ? t("admin.errorLastAdmin") : null);
  }

  function handleRoleChange(email, role) {
    const { list, error } = setRole(email, role);
    setWhitelist(list);
    setWhitelistError(error === "last-admin" ? t("admin.errorLastAdmin") : null);
  }

  async function handleImportFile(file) {
    setImporting(true);
    setImportSummary(null);
    setImportProgress({ done: 0, total: 0 });
    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length < 2) {
        setImportSummary({ addedCount: 0, totalRows: 0, failed: [] });
        return;
      }
      const [headerRow, ...dataRows] = rows;
      const columnMap = detectImportColumns(headerRow);
      const parsed = parseImportRows(dataRows, columnMap);

      setImportProgress({ done: 0, total: parsed.length });
      const geocoded = await geocodeImportedStores(parsed, {
        onProgress: (done, total) => setImportProgress({ done, total }),
      });

      const succeeded = geocoded.filter((s) => !s.geocodeFailed);
      const failed = geocoded.filter((s) => s.geocodeFailed);

      const updated = upsertStores(succeeded);
      setOverrides(updated);
      onStoresUpdated?.();
      setImportSummary({ addedCount: succeeded.length, totalRows: dataRows.length, failed });
    } catch {
      setImportSummary({ addedCount: 0, totalRows: 0, failed: [], error: true });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  function handleRemoveOverride(id) {
    setOverrides(removeOverride(id));
    onStoresUpdated?.();
  }

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">{t("admin.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("myCard.close")}
            className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t("admin.localOnlyWarning")}
          </p>

          <section className="mb-8">
            <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
              {t("admin.whitelistTitle")}
            </h3>
            <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
              {t("admin.whitelistHint")}
            </p>

            <ul className="mb-3 flex flex-col gap-1.5">
              {whitelist.map((entry) => (
                <li
                  key={entry.email}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm text-neutral-800 dark:text-neutral-200">
                      {entry.email}
                    </span>
                    {entry.email === currentUser?.email && (
                      <span className="shrink-0 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white dark:bg-amber-600 dark:text-neutral-950">
                        {t("admin.you")}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={entry.role}
                      onChange={(e) => handleRoleChange(entry.email, e.target.value)}
                      className="cursor-pointer rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                      <option value={ROLES.ADMIN}>{t("admin.roleAdmin")}</option>
                      <option value={ROLES.COMMERCIAL}>{t("admin.roleCommercial")}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelist(entry.email)}
                      aria-label={t("admin.removeAria")}
                      className="cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {whitelistError && (
              <p className="mb-2 text-xs text-red-500 dark:text-red-400">{whitelistError}</p>
            )}

            <form onSubmit={handleAddWhitelist} className="flex flex-wrap gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("admin.emailPlaceholder")}
                className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="cursor-pointer rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <option value={ROLES.ADMIN}>{t("admin.roleAdmin")}</option>
                <option value={ROLES.COMMERCIAL}>{t("admin.roleCommercial")}</option>
              </select>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
              >
                {t("admin.addButton")}
              </button>
            </form>
          </section>

          <section>
            <h3 className="mb-1 font-serif text-base text-neutral-900 dark:text-neutral-100">
              {t("admin.importTitle")}
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t("admin.importHint")}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
            >
              {importing
                ? importProgress
                  ? t("admin.geocoding", { done: importProgress.done, total: importProgress.total })
                  : t("admin.importing")
                : t("admin.importButton")}
            </button>

            {importSummary && (
              <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800">
                {importSummary.error ? (
                  <p className="text-red-500 dark:text-red-400">{t("myCard.importError")}</p>
                ) : (
                  <>
                    <p className="text-neutral-700 dark:text-neutral-200">
                      {t("admin.importSummary", {
                        added: importSummary.addedCount,
                        total: importSummary.totalRows,
                      })}
                    </p>
                    {importSummary.failed.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          {t("admin.geocodeFailedTitle", { count: importSummary.failed.length })}
                        </p>
                        <ul className="flex flex-col gap-1">
                          {importSummary.failed.map((s, i) => (
                            <li key={i} className="text-xs text-neutral-500 dark:text-neutral-400">
                              {s.name} — {s.city || s.address}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {overrides.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t("admin.importedStoresTitle", { count: overrides.length })}
                </p>
                <ul className="thin-scrollbar flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                  {overrides.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-xs dark:bg-neutral-800"
                    >
                      <span className="truncate text-neutral-700 dark:text-neutral-200">
                        {s.name} — {s.city}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOverride(s.id)}
                        aria-label={t("admin.removeAria")}
                        className="shrink-0 cursor-pointer text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
