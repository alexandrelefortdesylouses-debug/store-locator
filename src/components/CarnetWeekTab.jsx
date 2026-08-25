import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { optimizeRouteOrder } from "../utils/route";
import { formatDistanceKm } from "../utils/geo";
import { timeToMinutes } from "../utils/appointmentTimes";
import AppointmentTimeBadge from "./AppointmentTimeBadge";
import {
  getWeekPlan,
  assignStoreToDay,
  removeStoreFromDay,
  autoDistribute,
  clearWeekPlan,
} from "../utils/weekPlan";

const DAY_COUNT = 7;

function UnplannedRow({ store, dayOptions, onAssign }) {
  const { t } = useLanguage();
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", store.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="flex cursor-grab items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="min-w-0">
        <p className="truncate text-neutral-800 dark:text-neutral-100">{store.name}</p>
        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{store.city}</p>
      </div>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onAssign(store.id, e.target.value);
        }}
        aria-label={t("carnet.week.assignTo")}
        className="shrink-0 cursor-pointer rounded-full border border-neutral-300 bg-transparent px-2 py-1 text-xs text-neutral-600 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:text-neutral-300"
      >
        <option value="" disabled>
          {t("carnet.week.assignTo")}
        </option>
        {dayOptions.map((d) => (
          <option key={d.key} value={d.key}>
            {d.shortLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function DayColumn({
  dayKey,
  label,
  stores,
  appointmentTimes,
  onSetAppointmentTime,
  onClearAppointmentTime,
  onDropStore,
  onRemoveStore,
  onSendToAgenda,
}) {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const optimized = useMemo(() => (stores.length > 1 ? optimizeRouteOrder(stores, null) : null), [stores]);

  // Replaces the plain day-bucket order with an actual chronological
  // schedule once times are set: timed stops come first, earliest start
  // first; stops with no time yet stay at the end in their existing order
  // rather than being sorted arbitrarily (there's nothing to sort them by).
  const sortedStores = useMemo(() => {
    return [...stores].sort((a, b) => {
      const ta = timeToMinutes(appointmentTimes[a.id]?.start);
      const tb = timeToMinutes(appointmentTimes[b.id]?.start);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta - tb;
    });
  }, [stores, appointmentTimes]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const storeId = e.dataTransfer.getData("text/plain");
    if (storeId) onDropStore(storeId, dayKey);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex w-64 shrink-0 flex-col rounded-xl border p-3 transition ${
        dragOver
          ? "border-amber-400 ring-2 ring-amber-400"
          : "border-neutral-200 dark:border-neutral-700"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate font-serif text-sm capitalize text-neutral-900 dark:text-neutral-100">{label}</p>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {stores.length}
        </span>
      </div>
      {optimized && (
        <p className="mb-2 text-[11px] text-neutral-400 dark:text-neutral-500">
          {t("carnet.week.distanceHint", { km: formatDistanceKm(optimized.totalDistanceKm) })}
        </p>
      )}
      <div className="thin-scrollbar mb-2 flex min-h-[70px] flex-1 flex-col gap-1.5 overflow-y-auto">
        {stores.length === 0 ? (
          <p className="text-xs italic text-neutral-300 dark:text-neutral-600">{t("carnet.week.dropHint")}</p>
        ) : (
          sortedStores.map((store) => {
            const time = appointmentTimes[store.id];
            return (
              <div
                key={store.id}
                className="flex flex-col gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs dark:bg-neutral-800"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-neutral-700 dark:text-neutral-200">{store.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveStore(store.id, dayKey)}
                    aria-label={t("route.removeFromRoute")}
                    className="shrink-0 cursor-pointer text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <AppointmentTimeBadge
                  start={time?.start}
                  end={time?.end}
                  store={store}
                  date={dayKey}
                  onSave={(start, end) => onSetAppointmentTime(store.id, start, end)}
                  onClear={() => onClearAppointmentTime(store.id)}
                />
              </div>
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={() => onSendToAgenda(sortedStores)}
        disabled={stores.length === 0}
        className="w-full cursor-pointer rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
      >
        {t("carnet.week.sendToAgenda")}
      </button>
    </div>
  );
}

// Distributes the portfolio across the next 7 days ("Semaine" tab) —
// separate from the single-day `routeStops` state (App.jsx, used by
// RoutePlanner/CarnetAgendaTab): a store's day assignment here persists
// even after the active route is cleared, and "Envoyer vers l'Agenda"
// simply loads one day's stores into that shared state on demand.
export default function CarnetWeekTab({
  stores,
  onSendToAgenda,
  appointmentTimes = {},
  onSetAppointmentTime,
  onClearAppointmentTime,
}) {
  const { t, lang } = useLanguage();
  const [plan, setPlan] = useState(() => getWeekPlan());
  const locale = lang === "en" ? "en-US" : "fr-FR";

  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < DAY_COUNT; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      list.push({
        key,
        label: date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }),
        shortLabel: date.toLocaleDateString(locale, { weekday: "short", day: "numeric" }),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const storesById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const plannedIds = useMemo(() => new Set(Object.values(plan).flat()), [plan]);
  const unplanned = useMemo(() => stores.filter((s) => !plannedIds.has(s.id)), [stores, plannedIds]);

  function handleAssign(storeId, dayKey) {
    setPlan(assignStoreToDay(storeId, dayKey));
  }

  function handleRemove(storeId, dayKey) {
    setPlan(removeStoreFromDay(storeId, dayKey));
  }

  function handleAutoDistribute() {
    setPlan(
      autoDistribute(
        unplanned.map((s) => s.id),
        storesById,
        days.map((d) => d.key),
      ),
    );
  }

  function handleReset() {
    setPlan(clearWeekPlan());
  }

  if (stores.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        {t("carnet.week.empty")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-lg text-xs text-neutral-500 dark:text-neutral-400">{t("carnet.week.intro")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleAutoDistribute}
            disabled={unplanned.length === 0}
            className="cursor-pointer rounded-full border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
          >
            {t("carnet.week.autoDistribute")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="cursor-pointer rounded-full border border-neutral-300 px-3.5 py-2 text-xs font-medium text-neutral-600 transition hover:border-red-400 hover:text-red-600 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-red-500 dark:hover:text-red-400"
          >
            {t("carnet.week.reset")}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {t("carnet.week.poolTitle", { count: unplanned.length })}
        </p>
        {unplanned.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{t("carnet.week.poolEmpty")}</p>
        ) : (
          <div className="thin-scrollbar flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {unplanned.map((store) => (
              <UnplannedRow key={store.id} store={store} dayOptions={days} onAssign={handleAssign} />
            ))}
          </div>
        )}
      </div>

      <div className="thin-scrollbar flex gap-3 overflow-x-auto pb-2">
        {days.map((day) => (
          <DayColumn
            key={day.key}
            dayKey={day.key}
            label={day.label}
            stores={(plan[day.key] || []).map((id) => storesById.get(id)).filter(Boolean)}
            appointmentTimes={appointmentTimes}
            onSetAppointmentTime={onSetAppointmentTime}
            onClearAppointmentTime={onClearAppointmentTime}
            onDropStore={handleAssign}
            onRemoveStore={handleRemove}
            onSendToAgenda={onSendToAgenda}
          />
        ))}
      </div>
    </div>
  );
}
