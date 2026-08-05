import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import CarnetTableTab from "./CarnetTableTab";
import CarnetAgendaTab from "./CarnetAgendaTab";
import CarnetNotesTab from "./CarnetNotesTab";
import CarnetPerformanceTab from "./CarnetPerformanceTab";

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

const TAB_ICONS = { table: TableIcon, agenda: CalendarIcon, notes: NoteIcon, performance: ChartIcon };

export default function CarnetView({
  stores,
  statuses,
  visitNotes,
  onAddVisitNote,
  prospectFirstSeen,
  routeStops,
  routeOrder,
  onToggleRouteStop,
  onRemoveRouteStop,
  onClearRoute,
  onOptimizeRoute,
  userLocation,
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("table");
  const [carnetSelectedStoreId, setCarnetSelectedStoreId] = useState(null);

  function handleOpenNote(storeId) {
    setCarnetSelectedStoreId(storeId);
    setTab("notes");
  }

  function handleScheduleStore(store) {
    onToggleRouteStop(store);
    setTab("agenda");
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="thin-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
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

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {tab === "table" && (
          <CarnetTableTab
            stores={stores}
            statuses={statuses}
            visitNotes={visitNotes}
            onOpenNote={handleOpenNote}
            onScheduleStore={handleScheduleStore}
          />
        )}

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
    </div>
  );
}
