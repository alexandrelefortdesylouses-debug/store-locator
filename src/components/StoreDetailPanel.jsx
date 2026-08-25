import { Fragment } from "react";
import FavoriteButton from "./FavoriteButton";
import StoreNotes from "./StoreNotes";
import StatusSelector from "./StatusSelector";
import PrioritySelector from "./PrioritySelector";
import TagPicker from "./TagPicker";
import { FEATURED_BRANDS } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";
import { useLanguage } from "../i18n/LanguageContext";
import { GPS_APPS, buildPreferredDirectionsUrl } from "../utils/gpsPrefs";

export default function StoreDetailPanel({
  store,
  open,
  onClose,
  routeStopIds = [],
  onToggleRouteStop,
  isFavorite = false,
  onToggleFavorite,
  note = "",
  onSetNote,
  status = null,
  onSetStatus,
  priority = null,
  onSetPriority,
  tags = [],
  onSetTags,
  preferredGpsApp = GPS_APPS.GOOGLE,
  routeOrigin = null,
}) {
  const { t } = useLanguage();

  if (!store) return null;

  const directionsUrl = buildPreferredDirectionsUrl(preferredGpsApp, store, routeOrigin);
  const inRoute = routeStopIds.includes(store.id);

  return (
    <div
      className={`thin-scrollbar absolute inset-y-0 right-0 z-[500] w-full max-w-md overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-neutral-700 dark:bg-neutral-900 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            {t("storeDetail.partner")}
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug text-neutral-900 dark:text-neutral-100">
            {store.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {store.address}
          </p>
          <p className="mt-0.5 text-sm text-neutral-400 dark:text-neutral-500">
            {store.city}, {store.country}
          </p>
          {typeof store.distanceKm === "number" && (
            <p className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {formatDistanceKm(store.distanceKm)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleFavorite && (
            <FavoriteButton active={isFavorite} onToggle={() => onToggleFavorite(store.id)} />
          )}
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label={t("storeDetail.close")}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-5">
        {onToggleRouteStop && (
          <button
            type="button"
            onClick={() => onToggleRouteStop(store)}
            aria-pressed={inRoute}
            className={`mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              inRoute
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-neutral-300 text-neutral-700 hover:border-blue-400 hover:text-blue-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
            }`}
          >
            {inRoute ? (
              <>
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
                </svg>
                {t("route.removeFromRoute")}
              </>
            ) : (
              t("route.addToRoute")
            )}
          </button>
        )}

        {onSetStatus && <StatusSelector value={status} onChange={(s) => onSetStatus(store.id, s)} />}
        {onSetPriority && (
          <PrioritySelector value={priority} onChange={(p) => onSetPriority(store.id, p)} />
        )}
        {onSetTags && <TagPicker tags={tags} onChange={(t2) => onSetTags(store.id, t2)} />}

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t("storeDetail.brands")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {store.brands.map((brand) => {
              const featured = FEATURED_BRANDS.includes(brand);
              return (
                <span
                  key={brand}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    featured
                      ? "border-amber-700 bg-amber-700 text-white"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {brand}
                </span>
              );
            })}
          </div>
        </div>

        {store.hours && Object.keys(store.hours).length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("storeDetail.hours")}
            </p>
            <div className="grid max-w-sm grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.entries(store.hours).map(([day, hours]) => (
                <Fragment key={day}>
                  <span className="capitalize text-neutral-600 dark:text-neutral-400">
                    {day}
                  </span>
                  <span className="text-right text-neutral-900 dark:text-neutral-200">
                    {hours}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {(store.phone || store.email || store.website) && (
          <div className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
            {store.phone && <p>{store.phone}</p>}
            {store.email && <p>{store.email}</p>}
            {store.website && (
              <p>
                <a
                  href={
                    store.website.startsWith("http")
                      ? store.website
                      : `https://${store.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 hover:underline dark:text-amber-400"
                >
                  {store.website}
                </a>
              </p>
            )}
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
        >
          {t("storeDetail.directions")}
          <span aria-hidden>→</span>
        </a>

        {onSetNote && (
          <StoreNotes value={note} onChange={(text) => onSetNote(store.id, text)} />
        )}
      </div>
    </div>
  );
}
