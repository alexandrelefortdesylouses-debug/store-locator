import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { optimizeRouteOrder } from "../utils/route";
import IcsExportModal from "./IcsExportModal";
import AppointmentTimeBadge from "./AppointmentTimeBadge";
import Toast from "./Toast";

const TOAST_DURATION_MS = 3500;

export default function CarnetAgendaTab({
  stops,
  order,
  userLocation,
  onRemoveStop,
  onClear,
  onOptimize,
  appointmentTimes = {},
  onSetAppointmentTime,
  onClearAppointmentTime,
}) {
  const { t } = useLanguage();
  const [icsModalOpen, setIcsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const displayStops = order || stops;

  function handleOptimizeClick() {
    const result = optimizeRouteOrder(stops, userLocation);
    onOptimize(result);
  }

  function handleIcsExported() {
    setToastMessage(t("ics.toastSuccess"));
    window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  if (stops.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        {t("carnet.agenda.empty")}
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {t("route.selectedCount", { count: stops.length })}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer rounded-full px-2 py-1 text-xs text-neutral-500 hover:text-amber-700 dark:text-neutral-400 dark:hover:text-amber-400"
        >
          {t("route.clear")}
        </button>
      </div>

      <ol className="mb-4 flex flex-col gap-2">
        {displayStops.map((store, i) => (
          <li
            key={store.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex min-w-0 items-center gap-3">
              {order && (
                <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                  {i + 1}.
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-serif text-sm text-neutral-900 dark:text-neutral-100">
                  {store.name}
                </p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {store.address}, {store.city}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AppointmentTimeBadge
                start={appointmentTimes[store.id]?.start}
                end={appointmentTimes[store.id]?.end}
                store={store}
                onSave={(start, end) => onSetAppointmentTime(store.id, start, end)}
                onClear={() => onClearAppointmentTime(store.id)}
              />
              <button
                type="button"
                onClick={() => onRemoveStop(store.id)}
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                aria-label={t("route.removeFromRoute")}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>

      {!order && stops.length >= 2 && (
        <button
          type="button"
          onClick={handleOptimizeClick}
          className="mb-4 cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
        >
          {t("route.optimize")}
        </button>
      )}

      <button
        type="button"
        onClick={() => setIcsModalOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
      >
        {t("route.icsExport")}
      </button>

      {icsModalOpen && (
        <IcsExportModal
          stops={displayStops}
          onClose={() => setIcsModalOpen(false)}
          onExported={handleIcsExported}
        />
      )}
      <Toast message={toastMessage} />
    </div>
  );
}
