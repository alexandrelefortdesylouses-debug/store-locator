import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  optimizeRouteOrder,
  buildGoogleMapsUrls,
  buildWazeUrls,
  buildAppleMapsUrl,
} from "../utils/route";
import { exportRoutePdf } from "../utils/pdfExport";
import { formatDistanceKm } from "../utils/geo";
import IcsExportModal from "./IcsExportModal";
import Toast from "./Toast";

const TOAST_DURATION_MS = 3500;
const ORIGIN_GPS = "gps";
const ORIGIN_CUSTOM = "custom";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

// The two-option origin toggle asked for explicitly: "Ma position actuelle
// (GPS)" vs "Adresse personnalisée" — a per-trip choice made right here in
// the route panel, independent of (though seeded from) the app-wide
// default in Paramètres > Préférences. Picking GPS actively requests a
// fresh position via onLocateMe rather than waiting for the user to also
// remember to hit the map's separate "Me localiser" button.
function OriginToggle({ choice, onChoose, geoLoading, hasDefaultAddress, defaultAddressLabel }) {
  const { t } = useLanguage();
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("route.originLabel")}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChoose(ORIGIN_GPS)}
          aria-pressed={choice === ORIGIN_GPS}
          className={`flex-1 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition ${
            choice === ORIGIN_GPS
              ? "border-transparent bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
          }`}
        >
          {choice === ORIGIN_GPS && geoLoading ? t("route.originGpsLocating") : t("route.originGps")}
        </button>
        <button
          type="button"
          onClick={() => onChoose(ORIGIN_CUSTOM)}
          aria-pressed={choice === ORIGIN_CUSTOM}
          title={defaultAddressLabel || undefined}
          className={`flex-1 cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition ${
            choice === ORIGIN_CUSTOM
              ? "border-transparent bg-neutral-900 text-white dark:bg-amber-600 dark:text-neutral-950"
              : "border-neutral-300 text-neutral-600 hover:border-amber-400 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500"
          }`}
        >
          {t("route.originCustom")}
        </button>
      </div>
      {choice === ORIGIN_CUSTOM && !hasDefaultAddress && (
        <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          {t("route.originCustomMissing")}
        </p>
      )}
    </div>
  );
}

export default function RoutePlanner({
  stops,
  onRemoveStop,
  onClear,
  liveLocation,
  onLocateMe,
  geoLoading,
  geoError,
  gpsRealtimeEnabled,
  defaultAddress,
  onOptimize,
  notes = {},
}) {
  const { t, lang } = useLanguage();
  const [originChoice, setOriginChoice] = useState(() => (gpsRealtimeEnabled ? ORIGIN_GPS : ORIGIN_CUSTOM));
  const [optimized, setOptimized] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [icsModalOpen, setIcsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const lastGeoErrorRef = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), []);

  function showToast(message) {
    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }

  function handleIcsExported() {
    showToast(t("ics.toastSuccess"));
  }

  useEffect(() => {
    setOptimized(null);
    onOptimize?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, originChoice]);

  // Choosing (or already being on) "Ma position actuelle" actively
  // requests a fresh position as soon as there's a route to plan, rather
  // than silently exporting with no origin if the rep never separately
  // pressed the map's own "Me localiser" button.
  useEffect(() => {
    if (originChoice === ORIGIN_GPS && stops.length > 0 && !liveLocation && !geoLoading && !geoError) {
      onLocateMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originChoice, stops.length > 0]);

  // "Si la géolocalisation est désactivée ... bascule automatiquement sur
  // l'Option B" — a fresh geolocation failure (permission denied, no
  // browser support, timeout) while GPS is the selected origin falls back
  // to the saved default address automatically, so the export links never
  // silently end up with no origin at all.
  useEffect(() => {
    if (geoError && geoError !== lastGeoErrorRef.current && originChoice === ORIGIN_GPS) {
      if (defaultAddress) {
        setOriginChoice(ORIGIN_CUSTOM);
        showToast(t("route.originAutoFallback"));
      } else {
        showToast(t("route.originGpsUnavailable"));
      }
    }
    lastGeoErrorRef.current = geoError;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoError]);

  const effectiveOrigin =
    originChoice === ORIGIN_GPS
      ? liveLocation
      : defaultAddress
        ? { lat: defaultAddress.lat, lng: defaultAddress.lng }
        : null;

  // True while GPS is the selected origin but no coordinates are in hand
  // yet (still locating, or failed with no default address to fall back
  // to) — optimizing or exporting now would silently drop the very
  // origin the rep just asked for, so those actions stay blocked until
  // effectiveOrigin actually resolves.
  const originPending = originChoice === ORIGIN_GPS && !liveLocation;

  function handleOptimize() {
    const result = optimizeRouteOrder(stops, effectiveOrigin);
    setOptimized(result);
    onOptimize?.(result);
  }

  async function handleExportPdf() {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const dateValue = new Date().toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await exportRoutePdf({
        stops,
        order: optimized?.order,
        userLocation: effectiveOrigin,
        notes,
        labels: {
          title: t("route.pdfTitle"),
          dateLabel: t("route.pdfDateLabel"),
          dateValue,
          repLabel: t("route.pdfRepLabel"),
          stopsTitle: t("route.pdfStopsTitle"),
          noteLabel: t("route.pdfNoteLabel"),
          reportTitle: t("route.pdfReportTitle"),
          reportHint: t("route.pdfReportHint"),
          footer: t("route.pdfFooter"),
          filename: `thelios-tournee-${new Date().toISOString().slice(0, 10)}.pdf`,
        },
      });
    } finally {
      setExportingPdf(false);
    }
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

      <ul className="thin-scrollbar mb-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
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

      {stops.length >= 2 && (
        <OriginToggle
          choice={originChoice}
          onChoose={setOriginChoice}
          geoLoading={geoLoading}
          hasDefaultAddress={Boolean(defaultAddress)}
          defaultAddressLabel={defaultAddress?.label}
        />
      )}

      {stops.length < 2 ? (
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          {t("route.needTwo")}
        </p>
      ) : !optimized ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={originPending}
            className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-neutral-950"
          >
            {originPending ? t("route.originGpsLocating") : t("route.optimize")}
          </button>
          {originPending && (
            <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
              {t("route.originWaitingHint")}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("route.totalDistance", {
              km: formatDistanceKm(optimized.totalDistanceKm),
            })}
          </p>
          {(() => {
            const googleUrls = buildGoogleMapsUrls(optimized.order, effectiveOrigin);
            const wazeUrls = buildWazeUrls(optimized.order);
            const appleUrl = buildAppleMapsUrl(optimized.order, effectiveOrigin);
            return (
              <div className="flex flex-col gap-3">
                <div>
                  {googleUrls.length > 1 && (
                    <p className="mb-1 text-[11px] italic text-neutral-400 dark:text-neutral-500">
                      {t("route.splitHint", { count: googleUrls.length })}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {googleUrls.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-full bg-neutral-900 px-3 py-2.5 text-center text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
                      >
                        {googleUrls.length > 1
                          ? t("route.openGoogleMapsLeg", { n: i + 1, total: googleUrls.length })
                          : t("route.openGoogleMaps")}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[11px] italic text-neutral-400 dark:text-neutral-500" title={t("route.wazeHint")}>
                    {t("route.wazeHint")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wazeUrls.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-full border border-neutral-300 px-3 py-2.5 text-center text-xs font-medium text-neutral-700 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
                      >
                        {wazeUrls.length > 1
                          ? t("route.openWazeLeg", { n: i + 1, total: wazeUrls.length })
                          : t("route.openWaze")}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <a
                    href={appleUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={t("route.appleMapsHint")}
                    className="block w-full rounded-full border border-neutral-300 px-3 py-2.5 text-center text-xs font-medium text-neutral-700 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
                  >
                    {t("route.openAppleMaps")}
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
        >
          <DownloadIcon />
          {exportingPdf ? t("route.pdfExporting") : t("route.pdfExport")}
        </button>
        <button
          type="button"
          onClick={() => setIcsModalOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
        >
          <DownloadIcon />
          {t("route.icsExport")}
        </button>
      </div>

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
