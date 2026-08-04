import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  optimizeRouteOrder,
  buildGoogleMapsUrl,
  buildWazeUrl,
} from "../utils/route";
import { formatDistanceKm } from "../utils/geo";

export default function RoutePlanner({
  stops,
  onRemoveStop,
  onClear,
  userLocation,
  onOptimize,
}) {
  const { t } = useLanguage();
  const [optimized, setOptimized] = useState(null);

  useEffect(() => {
    setOptimized(null);
    onOptimize?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  function handleOptimize() {
    const result = optimizeRouteOrder(stops, userLocation);
    setOptimized(result);
    onOptimize?.(result);
  }

  if (stops.length === 0) return null;

  const displayStops = optimized?.order || stops;

  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-[450] mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
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

      <ul className="mb-3 flex flex-wrap gap-1.5">
        {displayStops.map((store, i) => (
          <li
            key={store.id}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-2.5 pr-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {optimized && (
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {i + 1}.
              </span>
            )}
            <span className="max-w-[140px] truncate">{store.name}</span>
            <button
              type="button"
              onClick={() => onRemoveStop(store.id)}
              className="cursor-pointer rounded-full p-1 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
              aria-label={t("route.removeFromRoute")}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {stops.length < 2 ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {t("route.needTwo")}
        </p>
      ) : !optimized ? (
        <button
          type="button"
          onClick={handleOptimize}
          className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-neutral-950"
        >
          {t("route.optimize")}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("route.totalDistance", {
              km: formatDistanceKm(optimized.totalDistanceKm),
            })}
          </p>
          <div className="flex gap-2">
            <a
              href={buildGoogleMapsUrl(optimized.order, userLocation)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-full bg-neutral-900 px-3 py-2.5 text-center text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
            >
              {t("route.openGoogleMaps")}
            </a>
            <a
              href={buildWazeUrl(optimized.order)}
              target="_blank"
              rel="noreferrer"
              title={t("route.wazeHint")}
              className="flex-1 rounded-full border border-neutral-300 px-3 py-2.5 text-center text-xs font-medium text-neutral-700 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
            >
              {t("route.openWaze")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
