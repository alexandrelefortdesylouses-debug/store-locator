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
const ORIGIN_HOME = "home";
const ORIGIN_STORE = "store";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase();
}

function optionRowClass(active) {
  return `flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
    active
      ? "bg-amber-50 font-medium text-amber-800 dark:bg-neutral-800 dark:text-amber-400"
      : "text-neutral-700 hover:bg-amber-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
  }`;
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

// The three-option starting-point dropdown asked for explicitly: live GPS,
// the saved home/agency address, or a specific optician from the
// portfolio (searched inline). A per-trip choice made right here in the
// route panel, independent of (though seeded from) the app-wide default
// in Paramètres > Préférences. Closes on an outside click, same pattern
// as CarnetTableTab's ExportMenu.
function OriginSelector({
  choice,
  onChooseGps,
  onChooseHome,
  onChooseStore,
  geoLoading,
  hasDefaultAddress,
  originStore,
  portfolioStores,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setSearchMode(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentLabel =
    choice === ORIGIN_GPS
      ? geoLoading
        ? t("route.originGpsLocating")
        : t("route.originGps")
      : choice === ORIGIN_HOME
        ? t("route.originHome")
        : originStore
          ? t("route.originStorePrefix", { name: originStore.name })
          : t("route.originStore");

  const q = normalize(query.trim());
  const results = (
    q
      ? portfolioStores.filter((s) => normalize(s.name).includes(q) || normalize(s.city).includes(q))
      : portfolioStores
  ).slice(0, 8);

  return (
    <div ref={rootRef} className="relative mb-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {t("route.originLabel")}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-neutral-300 bg-white px-3.5 py-2 text-left text-xs font-medium text-neutral-700 transition hover:border-amber-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-amber-500"
      >
        <span className="truncate">{currentLabel}</span>
        <span className="shrink-0 text-neutral-400">▾</span>
      </button>

      {open && (
        <div className="thin-scrollbar absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {!searchMode ? (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  onChooseGps();
                  setOpen(false);
                }}
                aria-pressed={choice === ORIGIN_GPS}
                className={optionRowClass(choice === ORIGIN_GPS)}
              >
                {t("route.originGps")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChooseHome();
                  setOpen(false);
                }}
                aria-pressed={choice === ORIGIN_HOME}
                className={optionRowClass(choice === ORIGIN_HOME)}
              >
                {t("route.originHome")}
              </button>
              {!hasDefaultAddress && (
                <p className="px-2.5 pb-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  {t("route.originHomeMissing")}
                </p>
              )}
              <button
                type="button"
                onClick={() => setSearchMode(true)}
                aria-pressed={choice === ORIGIN_STORE}
                className={optionRowClass(choice === ORIGIN_STORE)}
              >
                {t("route.originStore")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("route.originStoreSearchPlaceholder")}
                className="mb-1 rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1.5 text-sm text-neutral-900 focus:border-amber-400 focus:outline-none dark:border-neutral-600 dark:text-neutral-100"
              />
              <div className="thin-scrollbar max-h-48 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-neutral-400 dark:text-neutral-500">
                    {t("route.originStoreNoResults")}
                  </p>
                ) : (
                  results.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        onChooseStore(store.id);
                        setOpen(false);
                        setSearchMode(false);
                        setQuery("");
                      }}
                      className="flex w-full cursor-pointer flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition hover:bg-amber-50 dark:hover:bg-neutral-800"
                    >
                      <span className="text-sm text-neutral-800 dark:text-neutral-100">{store.name}</span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{store.city}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setSearchMode(false)}
                className="mt-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-xs text-amber-700 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-neutral-800"
              >
                {t("route.originStoreBack")}
              </button>
            </div>
          )}
        </div>
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
  portfolioStores = [],
  onOptimize,
  notes = {},
}) {
  const { t, lang } = useLanguage();
  const [originChoice, setOriginChoice] = useState(() => (gpsRealtimeEnabled ? ORIGIN_GPS : ORIGIN_HOME));
  const [originStoreId, setOriginStoreId] = useState(null);
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

  function handleChooseGps() {
    setOriginChoice(ORIGIN_GPS);
    setOriginStoreId(null);
  }

  function handleChooseHome() {
    setOriginChoice(ORIGIN_HOME);
    setOriginStoreId(null);
  }

  function handleChooseStore(storeId) {
    setOriginChoice(ORIGIN_STORE);
    setOriginStoreId(storeId);
  }

  useEffect(() => {
    setOptimized(null);
    onOptimize?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, originChoice, originStoreId]);

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
  // l'Option B ou C" — a fresh geolocation failure (permission denied, no
  // browser support, timeout) while GPS is selected falls back to the
  // saved home address automatically, so the export links never silently
  // end up with no origin at all. Falling back to a *specific optician*
  // (Option C) can't be automatic — there's no sensible default pick —
  // so that path only gets an explanatory message pointing at the manual
  // picker.
  useEffect(() => {
    if (geoError && geoError !== lastGeoErrorRef.current && originChoice === ORIGIN_GPS) {
      if (defaultAddress) {
        setOriginChoice(ORIGIN_HOME);
        showToast(t("route.originAutoFallback"));
      } else {
        showToast(t("route.originGpsUnavailable"));
      }
    }
    lastGeoErrorRef.current = geoError;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoError]);

  const originStore = originStoreId ? portfolioStores.find((s) => s.id === originStoreId) || null : null;

  const effectiveOrigin =
    originChoice === ORIGIN_GPS
      ? liveLocation
      : originChoice === ORIGIN_HOME
        ? defaultAddress
          ? { lat: defaultAddress.lat, lng: defaultAddress.lng }
          : null
        : originStore
          ? { lat: originStore.lat, lng: originStore.lng }
          : null;

  // True whenever the chosen origin isn't actually resolvable yet (GPS
  // still locating or failed with no fallback, home chosen with no saved
  // address, or a specific optician chosen but not yet picked) —
  // optimizing or exporting now would silently drop the very origin the
  // rep just asked for, so those actions stay blocked until
  // effectiveOrigin actually resolves.
  const originPending =
    (originChoice === ORIGIN_GPS && !liveLocation) ||
    (originChoice === ORIGIN_HOME && !defaultAddress) ||
    (originChoice === ORIGIN_STORE && !originStore);

  // If the optician picked as the starting point is also one of the
  // route's own stops, treating it as both origin and destination would
  // send the rep back to a place they're starting from — excluded from
  // the points actually optimized/exported, same idea for both.
  const planningStops =
    originChoice === ORIGIN_STORE && originStoreId
      ? stops.filter((s) => s.id !== originStoreId)
      : stops;
  const originIsOnlyStop = originChoice === ORIGIN_STORE && stops.length > 0 && planningStops.length === 0;

  function handleOptimize() {
    const result = optimizeRouteOrder(planningStops, effectiveOrigin);
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
        stops: planningStops,
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
        <OriginSelector
          choice={originChoice}
          onChooseGps={handleChooseGps}
          onChooseHome={handleChooseHome}
          onChooseStore={handleChooseStore}
          geoLoading={geoLoading}
          hasDefaultAddress={Boolean(defaultAddress)}
          originStore={originStore}
          portfolioStores={portfolioStores}
        />
      )}

      {stops.length < 2 ? (
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          {t("route.needTwo")}
        </p>
      ) : originIsOnlyStop ? (
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          {t("route.originStoreIsOnlyStop")}
        </p>
      ) : !optimized ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={originPending}
            className="w-full cursor-pointer rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-neutral-950"
          >
            {originPending
              ? originChoice === ORIGIN_GPS && geoLoading
                ? t("route.originGpsLocating")
                : t("route.originPendingButton")
              : t("route.optimize")}
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
