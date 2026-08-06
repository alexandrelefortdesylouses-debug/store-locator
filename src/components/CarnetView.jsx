import { useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import CarnetTableTab from "./CarnetTableTab";
import CarnetFolderSidebar from "./CarnetFolderSidebar";
import CarnetFolderNotes from "./CarnetFolderNotes";
import CarnetAgendaTab from "./CarnetAgendaTab";
import CarnetNotesTab from "./CarnetNotesTab";
import CarnetPerformanceTab from "./CarnetPerformanceTab";
import EndOfDayReportModal from "./EndOfDayReportModal";
import Toast from "./Toast";
import {
  getFolders,
  createFolder,
  renameFolder,
  setFolderColor,
  deleteFolder,
  getFolderMembers,
  addStoreToFolder,
  removeStoreFromFolder,
  addStoresToFolder,
  getFolderNotes,
  setFolderNote,
} from "../utils/folders";
import { STORE_STATUSES } from "../utils/myCard";
import { exportFolderToPdf } from "../utils/folderExportPdf";
import { exportFolderToXlsx } from "../utils/folderExportXlsx";

const TOAST_DURATION_MS = 3500;

const EXPORT_STATUS_ORDER = [
  STORE_STATUSES.ACTIVE_CLIENT,
  STORE_STATUSES.PROSPECT,
  STORE_STATUSES.APPOINTMENT_PENDING,
  STORE_STATUSES.REFUSED,
];

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "dossier";
}

const TABS = ["table", "agenda", "notes", "performance"];

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M9 4v16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
      />
      <path strokeLinecap="round" d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
      />
      <path strokeLinecap="round" d="M9 13l2 2 4-4" />
    </svg>
  );
}

const TAB_ICONS = { table: TableIcon, agenda: CalendarIcon, notes: NoteIcon, performance: ChartIcon };

export default function CarnetView({
  stores,
  statuses,
  onSetStatus,
  priorities,
  onSetPriority,
  visitNotes,
  onAddVisitNote,
  prospectFirstSeen,
  favoriteIds,
  routeStops,
  routeOrder,
  onToggleRouteStop,
  onAddRouteStops,
  onRemoveRouteStop,
  onClearRoute,
  onOptimizeRoute,
  onViewOnMap,
  userLocation,
}) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState("table");
  const [carnetSelectedStoreId, setCarnetSelectedStoreId] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [folders, setFolders] = useState(() => getFolders());
  const [folderMembers, setFolderMembers] = useState(() => getFolderMembers());
  const [folderNotes, setFolderNotes] = useState(() => getFolderNotes());
  const [selectedFolderId, setSelectedFolderId] = useState("all");

  function handleOpenNote(storeId) {
    setCarnetSelectedStoreId(storeId);
    setTab("notes");
  }

  function handleScheduleStore(store) {
    onToggleRouteStop(store);
    setTab("agenda");
  }

  function handleReportExported(format) {
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(format === "pdf" ? t("eodReport.toastSuccessPdf") : t("eodReport.toastSuccessDocx"));
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  // storeIdOrIds is only passed when a folder is created from the per-row
  // or bulk "assign to folder" modal (create-and-add-in-one-step); the
  // sidebar's own "+ Nouveau dossier" creates an empty folder.
  function handleCreateFolder(name, storeIdOrIds) {
    const updated = createFolder(name);
    setFolders(updated);
    if (storeIdOrIds) {
      const newFolder = updated[updated.length - 1];
      const ids = Array.isArray(storeIdOrIds) ? storeIdOrIds : [storeIdOrIds];
      setFolderMembers(addStoresToFolder(newFolder.id, ids));
    }
  }

  function handleRenameFolder(folderId, name) {
    setFolders(renameFolder(folderId, name));
  }

  function handleChangeFolderColor(folderId, color) {
    setFolders(setFolderColor(folderId, color));
  }

  function handleDeleteFolder(folderId) {
    setFolders(deleteFolder(folderId));
    setFolderMembers(getFolderMembers());
    setFolderNotes(getFolderNotes());
    if (selectedFolderId === folderId) setSelectedFolderId("all");
  }

  function handleToggleFolderMembership(folderId, storeId) {
    const isMember = (folderMembers[folderId] || []).includes(storeId);
    setFolderMembers(
      isMember ? removeStoreFromFolder(folderId, storeId) : addStoreToFolder(folderId, storeId),
    );
  }

  function handleBulkAddToFolder(folderId, storeIds) {
    setFolderMembers(addStoresToFolder(folderId, storeIds));
  }

  function handleDropStoreOnFolder(folderId, storeId) {
    setFolderMembers(addStoreToFolder(folderId, storeId));
  }

  function handleSetFolderNote(folderId, text) {
    setFolderNotes(setFolderNote(folderId, text));
  }

  const folderStoreIdSet = useMemo(() => new Set(stores.map((s) => s.id)), [stores]);

  const countsByFolder = useMemo(() => {
    const counts = {
      all: stores.length,
      favorites: stores.filter((s) => favoriteIds.includes(s.id)).length,
    };
    folders.forEach((folder) => {
      counts[folder.id] = (folderMembers[folder.id] || []).filter((id) => folderStoreIdSet.has(id)).length;
    });
    return counts;
  }, [stores, favoriteIds, folders, folderMembers, folderStoreIdSet]);

  const tableStores = useMemo(() => {
    if (selectedFolderId === "all") return stores;
    if (selectedFolderId === "favorites") return stores.filter((s) => favoriteIds.includes(s.id));
    const memberIds = new Set(folderMembers[selectedFolderId] || []);
    return stores.filter((s) => memberIds.has(s.id));
  }, [stores, selectedFolderId, favoriteIds, folderMembers]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) || null;
  const currentViewLabel =
    selectedFolderId === "all"
      ? t("carnet.folders.all")
      : selectedFolderId === "favorites"
        ? t("carnet.folders.favorites")
        : selectedFolder?.name || "";

  function buildKpiRows(entries) {
    const rows = [{ label: t("carnet.export.kpiTotal"), value: entries.length }];
    EXPORT_STATUS_ORDER.forEach((status) => {
      rows.push({
        label: t(`myCard.status.${status}`),
        value: entries.filter((s) => statuses[s.id] === status).length,
      });
    });
    return rows;
  }

  function buildExportLabels(entries) {
    const statusLabels = Object.fromEntries(
      Object.values(STORE_STATUSES).map((s) => [s, t(`myCard.status.${s}`)]),
    );
    const dateValue = new Date().toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const slug = slugify(currentViewLabel);
    return {
      dateLabel: t("carnet.export.dateLabel"),
      dateValue,
      countLabel: t("carnet.export.countLabel"),
      notesTitle: t("carnet.folders.notesTitle", { name: currentViewLabel }),
      kpiTitle: t("carnet.export.kpiTitle"),
      kpiRows: buildKpiRows(entries),
      detailTitle: t("carnet.export.detailTitle"),
      noEntries: t("carnet.export.noEntries"),
      brandsLabel: t("storeDetail.brands"),
      phoneLabel: t("carnet.export.phoneLabel"),
      statusLabels,
      statusNone: t("myCard.status.none"),
      colName: t("carnet.table.colName"),
      colCity: t("carnet.table.colCity"),
      colPostal: t("carnet.table.colPostal"),
      colBrands: t("carnet.table.colBrands"),
      colStatus: t("carnet.table.colStatus"),
      colPhone: t("carnet.export.colPhone"),
      sheetName: currentViewLabel.slice(0, 31) || "Dossier",
      footer: t("route.pdfFooter"),
      filename: `thelios-dossier-${slug}.pdf`,
    };
  }

  async function handleExportFolder(format, entries) {
    const notes = selectedFolder ? folderNotes[selectedFolder.id] || "" : "";
    const labels = buildExportLabels(entries);
    if (format === "xlsx") {
      labels.filename = `thelios-dossier-${slugify(currentViewLabel)}.xlsx`;
    }
    if (format === "pdf") {
      await exportFolderToPdf({ title: currentViewLabel, notes, entries, statuses, labels });
    } else {
      await exportFolderToXlsx({ title: currentViewLabel, notes, entries, statuses, labels });
    }
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(t("carnet.export.toastSuccess"));
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  function handleCreateRoute(entries) {
    onAddRouteStops(entries);
    setTab("agenda");
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(t("carnet.export.toastRouteCreated", { count: entries.length }));
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="flex shrink-0 flex-col gap-2 border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="thin-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((key) => {
            const Icon = TAB_ICONS[key];
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium uppercase tracking-wide transition sm:px-4 ${
                  active
                    ? "bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
                    : "text-neutral-500 hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400"
                }`}
              >
                <Icon />
                {t(`carnet.tab.${key}`)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-full border border-neutral-300 px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400 sm:self-auto"
        >
          <ReportIcon />
          {t("eodReport.openButton")}
        </button>
      </div>

      {tab === "table" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
          <CarnetFolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onChangeFolderColor={handleChangeFolderColor}
            onDeleteFolder={handleDeleteFolder}
            onDropStoreOnFolder={handleDropStoreOnFolder}
            countsByFolder={countsByFolder}
          />
          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {selectedFolder && (
              <CarnetFolderNotes
                folder={selectedFolder}
                note={folderNotes[selectedFolder.id] || ""}
                onSave={(text) => handleSetFolderNote(selectedFolder.id, text)}
              />
            )}
            <CarnetTableTab
              stores={tableStores}
              statuses={statuses}
              onSetStatus={onSetStatus}
              priorities={priorities}
              onSetPriority={onSetPriority}
              onOpenNote={handleOpenNote}
              onScheduleStore={handleScheduleStore}
              onViewOnMap={onViewOnMap}
              folders={folders}
              folderMembers={folderMembers}
              onToggleFolderMembership={handleToggleFolderMembership}
              onBulkAddToFolder={handleBulkAddToFolder}
              onCreateFolder={handleCreateFolder}
              onExportFolder={handleExportFolder}
              onCreateRoute={handleCreateRoute}
            />
          </div>
        </div>
      ) : (
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === "agenda" && (
            <CarnetAgendaTab
              stops={routeStops}
              order={routeOrder}
              userLocation={userLocation}
              onRemoveStop={onRemoveRouteStop}
              onClear={onClearRoute}
              onOptimize={onOptimizeRoute}
            />
          )}

          {tab === "notes" && (
            <CarnetNotesTab
              stores={stores}
              selectedStoreId={carnetSelectedStoreId}
              onSelectStore={setCarnetSelectedStoreId}
              statuses={statuses}
              visitNotes={visitNotes}
              onAddVisitNote={onAddVisitNote}
            />
          )}

          {tab === "performance" && (
            <CarnetPerformanceTab
              stores={stores}
              visitNotes={visitNotes}
              prospectFirstSeen={prospectFirstSeen}
            />
          )}
        </div>
      )}

      {reportModalOpen && (
        <EndOfDayReportModal
          stores={stores}
          visitNotes={visitNotes}
          statuses={statuses}
          onClose={() => setReportModalOpen(false)}
          onExported={handleReportExported}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
