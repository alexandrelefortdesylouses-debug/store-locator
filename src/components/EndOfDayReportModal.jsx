import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { buildReportRows } from "../utils/endOfDayReport";
import { getRepName, setRepName, STORE_STATUSES } from "../utils/myCard";
import { getStoreZip } from "../utils/postalCode";
import { STATUS_COLORS } from "../utils/palette";
import { exportEndOfDayReportPdf } from "../utils/endOfDayReportPdf";
import { exportEndOfDayReportDocx } from "../utils/endOfDayReportDocx";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text) {
  return String(text ?? "").normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function todayDateString(lang) {
  return new Date().toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function todayFileDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EndOfDayReportModal({ stores, visitNotes, statuses, onClose, onExported }) {
  const { t, lang } = useLanguage();
  const [repName, setRepNameState] = useState(() => getRepName());
  const [globalNote, setGlobalNote] = useState("");
  const [otherTasks, setOtherTasks] = useState("");
  const [rows, setRows] = useState(() => buildReportRows({ stores, visitNotes }));
  const [checkedIds, setCheckedIds] = useState(
    () => new Set(buildReportRows({ stores, visitNotes }).filter((r) => r.hasNoteToday).map((r) => r.store.id)),
  );
  const [generating, setGenerating] = useState(null);
  const [search, setSearch] = useState("");

  const selectedCount = checkedIds.size;

  const visibleRows = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return rows;
    return rows.filter((row) => {
      const zip = getStoreZip(row.store);
      const haystack = normalize(`${row.store.name} ${row.store.city} ${zip || ""}`);
      return haystack.includes(query);
    });
  }, [rows, search]);

  function handleRepNameChange(value) {
    setRepNameState(value);
    setRepName(value);
  }

  function toggleChecked(storeId) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  }

  function handleRowNoteChange(storeId, value) {
    setRows((prev) => prev.map((row) => (row.store.id === storeId ? { ...row, note: value } : row)));
  }

  function buildLabels() {
    const dateStr = todayFileDateString();
    const statusLabels = Object.fromEntries(
      Object.values(STORE_STATUSES).map((s) => [s, t(`myCard.status.${s}`)]),
    );
    return {
      title: t("eodReport.pdfTitle"),
      dateLabel: t("eodReport.dateLabel"),
      repLabel: t("eodReport.repLabel"),
      repPlaceholder: t("eodReport.repPlaceholder"),
      countLabel: t("eodReport.countLabel"),
      globalTitle: t("eodReport.globalTitle"),
      noGlobalNote: t("eodReport.noGlobalNote"),
      otherTasksTitle: t("eodReport.otherTasksTitle"),
      noOtherTasks: t("eodReport.noOtherTasks"),
      detailTitle: t("eodReport.detailTitle"),
      noVisits: t("eodReport.noVisitsToday"),
      brandsLabel: t("storeDetail.brands"),
      noteLabel: t("eodReport.individualNoteLabel"),
      noNote: t("eodReport.noIndividualNote"),
      footer: t("route.pdfFooter"),
      statusLabels,
      filename: `rapport-fin-de-journee-${dateStr}.pdf`,
      docxFilename: `rapport-fin-de-journee-${dateStr}.docx`,
    };
  }

  async function handleExport(format) {
    if (generating) return;
    setGenerating(format);
    try {
      const labels = buildLabels();
      const entries = rows.filter((row) => checkedIds.has(row.store.id));
      const payload = {
        date: todayDateString(lang),
        repName,
        globalNote,
        otherTasks,
        entries,
        statuses,
        labels,
      };
      if (format === "pdf") {
        await exportEndOfDayReportPdf(payload);
      } else {
        await exportEndOfDayReportDocx(payload);
      }
      onExported?.(format);
    } finally {
      setGenerating(null);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <div>
            <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
              {t("eodReport.modalTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              {todayDateString(lang)}
            </p>
          </div>
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
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t("eodReport.repLabel")}
              </label>
              <input
                type="text"
                value={repName}
                onChange={(e) => handleRepNameChange(e.target.value)}
                placeholder={t("eodReport.repPlaceholder")}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t("eodReport.countLabel")}
              </label>
              <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                {selectedCount}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("eodReport.globalTitle")}
            </p>
            <textarea
              value={globalNote}
              onChange={(e) => setGlobalNote(e.target.value)}
              rows={3}
              placeholder={t("eodReport.globalPlaceholder")}
              className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />
          </div>

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("eodReport.otherTasksTitle")}
            </p>
            <textarea
              value={otherTasks}
              onChange={(e) => setOtherTasks(e.target.value)}
              rows={3}
              placeholder={t("eodReport.otherTasksPlaceholder")}
              className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:text-neutral-100"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("eodReport.detailTitle")}
            </p>
            <p className="mb-2 text-[11px] text-neutral-400 dark:text-neutral-500">
              {t("eodReport.checkHint")}
            </p>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                {t("eodReport.emptyPortfolio")}
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("eodReport.searchPlaceholder")}
                  className="mb-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
                {visibleRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    {t("eodReport.noSearchResults")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {visibleRows.map((row) => {
                      const checked = checkedIds.has(row.store.id);
                      const status = statuses[row.store.id];
                      const zip = getStoreZip(row.store);
                      return (
                        <li
                          key={row.store.id}
                          className={`rounded-xl border p-3.5 transition ${
                            checked
                              ? "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                              : "border-neutral-100 bg-transparent opacity-60 dark:border-neutral-800"
                          }`}
                        >
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleChecked(row.store.id)}
                              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-amber-600"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-serif text-base text-neutral-900 dark:text-neutral-100">
                                  {row.store.name}
                                </p>
                                {status && (
                                  <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{ background: STATUS_COLORS[status] }}
                                    />
                                    {t(`myCard.status.${status}`)}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                {row.store.city}
                                {zip ? ` (${zip})` : ""}
                              </p>
                              {row.store.brands.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {row.store.brands.map((brand) => (
                                    <span
                                      key={brand}
                                      className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    >
                                      {brand}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </label>

                          {checked && (
                            <div className="mt-2.5 pl-6">
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                {t("eodReport.individualNoteLabel")}
                              </label>
                              <textarea
                                value={row.note}
                                onChange={(e) => handleRowNoteChange(row.store.id, e.target.value)}
                                rows={2}
                                placeholder={t("eodReport.noIndividualNote")}
                                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 p-4 dark:border-neutral-700 sm:flex-row">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={Boolean(generating)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
          >
            {generating === "pdf" ? t("eodReport.generating") : t("eodReport.downloadPdf")}
          </button>
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={Boolean(generating)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-amber-400 hover:text-amber-700 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
          >
            {generating === "docx" ? t("eodReport.generating") : t("eodReport.downloadDocx")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
