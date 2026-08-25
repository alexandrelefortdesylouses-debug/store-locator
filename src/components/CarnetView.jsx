import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import CarnetTableTab from "./CarnetTableTab";
import CarnetFolderSidebar from "./CarnetFolderSidebar";
import CarnetFolderNotes from "./CarnetFolderNotes";
import CarnetAgendaTab from "./CarnetAgendaTab";
import CarnetWeekTab from "./CarnetWeekTab";
import CarnetNotesTab from "./CarnetNotesTab";
import CarnetVisitNoteModal from "./CarnetVisitNoteModal";
import CarnetPerformanceTab from "./CarnetPerformanceTab";
import EndOfDayReportModal from "./EndOfDayReportModal";
import Toast from "./Toast";
import {
  getFolders,
  createFolder,
  renameFolder,
  setFolderColor,
  deleteFolder,
  snapshotFolderState,
  restoreFolderSnapshot,
  getFolderMembers,
  addStoreToFolder,
  removeStoreFromFolder,
  addStoresToFolder,
  getFolderNotes,
  setFolderNote,
  reorderFolderStep,
  reorderFolderDrop,
  getFolderSortMode,
  setFolderSortMode,
} from "../utils/folders";
import { STORE_STATUSES } from "../utils/myCard";
import { exportFolderToPdf } from "../utils/folderExportPdf";
import { exportFolderToXlsx } from "../utils/folderExportXlsx";

const TOAST_DURATION_MS = 3500;
// Undo toasts stay up longer than a plain confirmation toast — the rep
// needs a beat to notice the destructive action, read the message, and
// decide to click "Annuler" before it's gone for good.
const UNDO_TOAST_DURATION_MS = 7000;

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

const TABS = ["table", "agenda", "week", "notes", "performance"];

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

function WeekIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M3 9h18M8 3v3M16 3v3" />
      <path strokeLinecap="round" d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" />
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

const TAB_ICONS = {
  table: TableIcon,
  agenda: CalendarIcon,
  week: WeekIcon,
  notes: NoteIcon,
  performance: ChartIcon,
};

export default function CarnetView({
  stores,
  allStores,
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
  appointmentTimes,
  onSetAppointmentTime,
  onClearAppointmentTime,
  onOpenStore,
  userLocation,
  preferredGpsApp,
  pendingFolderId,
  onConsumePendingFolder,
}) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState("table");
  const [noteModalStoreId, setNoteModalStoreId] = useState(null);
  const [carnetSearch, setCarnetSearch] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [folders, setFolders] = useState(() => getFolders());
  const [folderMembers, setFolderMembers] = useState(() => getFolderMembers());
  const [folderNotes, setFolderNotes] = useState(() => getFolderNotes());
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [folderSortMode, setFolderSortModeState] = useState(() => getFolderSortMode());

  // Folder badges in the table (and the sidebar) both need to land on the
  // same folder with a clean slate — clearing any leftover free-text
  // search avoids the confusing "I clicked a folder and the row I clicked
  // it from disappeared" case when the search text doesn't happen to match
  // that folder's other members.
  function handleSelectFolder(folderId) {
    setSelectedFolderId(folderId);
    setCarnetSearch("");
  }

  // One-shot "jump to this folder" request from the global command palette
  // (Cmd/Ctrl+K) — applied as soon as it arrives, then immediately cleared
  // so re-opening the palette and picking the same folder again still
  // triggers a fresh navigation (a value that never changes wouldn't
  // re-fire this effect).
  useEffect(() => {
    if (!pendingFolderId) return;
    handleSelectFolder(pendingFolderId);
    setTab("table");
    onConsumePendingFolder?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFolderId]);

  function handleOpenNote(storeId) {
    setNoteModalStoreId(storeId);
  }

  const allBrands = useMemo(
    () => [...new Set((allStores || stores).flatMap((s) => s.brands))].sort((a, b) => a.localeCompare(b)),
    [allStores, stores],
  );

  const noteModalStore = noteModalStoreId ? stores.find((s) => s.id === noteModalStoreId) : null;

  function handleScheduleStore(store) {
    onToggleRouteStop(store);
    setTab("agenda");
  }

  // "Envoyer vers l'Agenda" from the Semaine tab: replaces whatever route
  // is currently active with that day's planned stores (rather than
  // merging), since sending a specific day is meant to set up exactly that
  // day's tour, not pile onto leftovers from a previous one.
  function handleSendDayToAgenda(dayStores) {
    onClearRoute();
    onAddRouteStops(dayStores);
    setTab("agenda");
  }

  // Used by the Bloc-Notes @mention badges: a brand mention filters Mon
  // Carnet's table down to that brand by reusing its existing free-text
  // search (which already matches against store.brands).
  function handleFilterBrand(brand) {
    setCarnetSearch(brand);
    setTab("table");
  }

  function handleReportExported(format) {
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text: format === "pdf" ? t("eodReport.toastSuccessPdf") : t("eodReport.toastSuccessDocx") });
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  // Empty folder or subfolder creation from the sidebar's "+" controls —
  // parentId is null for a top-level folder, or another folder's id to
  // nest it as a subfolder.
  function handleCreateFolder(name, parentId) {
    setFolders(createFolder(name, parentId));
  }

  // Create-and-assign-in-one-step from the per-row or bulk "assign to
  // folder" modal — always creates a top-level folder (the modal doesn't
  // expose choosing a parent; the sidebar is the dedicated place for
  // building out the tree itself).
  function handleCreateAndAssignFolder(name, storeIdOrIds) {
    const updated = createFolder(name);
    setFolders(updated);
    const newFolder = updated[updated.length - 1];
    const ids = Array.isArray(storeIdOrIds) ? storeIdOrIds : [storeIdOrIds];
    setFolderMembers(addStoresToFolder(newFolder.id, ids));
  }

  function handleRenameFolder(folderId, name) {
    setFolders(renameFolder(folderId, name));
  }

  function handleChangeFolderColor(folderId, color) {
    setFolders(setFolderColor(folderId, color));
  }

  function handleDeleteFolder(folderId) {
    const deletedFolder = folders.find((f) => f.id === folderId);
    const previousSelectedFolderId = selectedFolderId;
    const snapshot = snapshotFolderState();

    const updated = deleteFolder(folderId);
    setFolders(updated);
    setFolderMembers(getFolderMembers());
    setFolderNotes(getFolderNotes());
    // Deleting a folder cascades to its subfolders (see deleteFolder) — if
    // the currently-selected view was one of those subfolders, it's gone
    // too, so fall back to "all" rather than showing an empty dead end.
    if (selectedFolderId !== "all" && selectedFolderId !== "favorites" && !updated.some((f) => f.id === selectedFolderId)) {
      setSelectedFolderId("all");
    }

    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage({
      text: t("carnet.folders.deletedToast", { name: deletedFolder?.name || "" }),
      actionLabel: t("carnet.folders.undoDelete"),
      onAction: () => {
        window.clearTimeout(toastTimeoutRef.current);
        restoreFolderSnapshot(snapshot);
        setFolders(getFolders());
        setFolderMembers(getFolderMembers());
        setFolderNotes(getFolderNotes());
        setSelectedFolderId(previousSelectedFolderId);
        setToastMessage(null);
      },
    });
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), UNDO_TOAST_DURATION_MS);
  }

  function handleReorderFolderStep(folderId, direction) {
    setFolders(reorderFolderStep(folderId, direction));
    if (folderSortMode !== "custom") handleSetFolderSortMode("custom");
  }

  function handleReorderFolderDrop(draggedId, targetId) {
    setFolders(reorderFolderDrop(draggedId, targetId));
    if (folderSortMode !== "custom") handleSetFolderSortMode("custom");
  }

  function handleSetFolderSortMode(mode) {
    setFolderSortMode(mode);
    setFolderSortModeState(mode);
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
    setToastMessage({ text: t("carnet.export.toastSuccess") });
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  function handleCreateRoute(entries) {
    onAddRouteStops(entries);
    setTab("agenda");
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text: t("carnet.export.toastRouteCreated", { count: entries.length }) });
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
          className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 self-start rounded-full bg-neutral-900 px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500 sm:self-auto"
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
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onChangeFolderColor={handleChangeFolderColor}
            onDeleteFolder={handleDeleteFolder}
            onDropStoreOnFolder={handleDropStoreOnFolder}
            onReorderFolderStep={handleReorderFolderStep}
            onReorderFolderDrop={handleReorderFolderDrop}
            countsByFolder={countsByFolder}
            sortMode={folderSortMode}
            onSetSortMode={handleSetFolderSortMode}
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
              visitNotes={visitNotes}
              onOpenNote={handleOpenNote}
              onScheduleStore={handleScheduleStore}
              preferredGpsApp={preferredGpsApp}
              routeOrigin={userLocation}
              folders={folders}
              folderMembers={folderMembers}
              onToggleFolderMembership={handleToggleFolderMembership}
              onBulkAddToFolder={handleBulkAddToFolder}
              onCreateAndAssignFolder={handleCreateAndAssignFolder}
              onSelectFolder={handleSelectFolder}
              onExportFolder={handleExportFolder}
              onCreateRoute={handleCreateRoute}
              search={carnetSearch}
              onSearchChange={setCarnetSearch}
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
              appointmentTimes={appointmentTimes}
              onSetAppointmentTime={onSetAppointmentTime}
              onClearAppointmentTime={onClearAppointmentTime}
            />
          )}

          {tab === "week" && (
            <CarnetWeekTab
              stores={stores}
              onSendToAgenda={handleSendDayToAgenda}
              appointmentTimes={appointmentTimes}
              onSetAppointmentTime={onSetAppointmentTime}
              onClearAppointmentTime={onClearAppointmentTime}
            />
          )}

          {tab === "notes" && (
            <CarnetNotesTab
              stores={stores}
              allBrands={allBrands}
              onOpenStore={onOpenStore}
              onFilterBrand={handleFilterBrand}
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

      {noteModalStore && (
        <CarnetVisitNoteModal
          store={noteModalStore}
          status={statuses[noteModalStore.id]}
          entries={visitNotes[noteModalStore.id] || []}
          onAddVisitNote={onAddVisitNote}
          onClose={() => setNoteModalStoreId(null)}
        />
      )}

      <Toast
        message={toastMessage?.text}
        actionLabel={toastMessage?.actionLabel}
        onAction={toastMessage?.onAction}
      />
    </div>
  );
}
