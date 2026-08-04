import { FEATURED_BRANDS } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";
import { MAX_ROUTE_STOPS } from "../utils/route";
import FavoriteButton from "./FavoriteButton";
import StatusDot from "./StatusDot";
import { useLanguage } from "../i18n/LanguageContext";

function RouteCheckbox({ inRoute, disabled, onToggle, t }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      aria-pressed={inRoute}
      aria-label={inRoute ? t("route.removeFromRoute") : t("route.addToRoute")}
      title={inRoute ? t("route.removeFromRoute") : t("route.addToRoute")}
      className={`mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        inRoute
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-neutral-300 bg-white text-transparent hover:border-blue-400 dark:border-neutral-600 dark:bg-neutral-800"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
      </svg>
    </button>
  );
}

export default function StoreList({
  stores,
  selectedStoreId,
  onSelectStore,
  routeStopIds = [],
  onToggleRouteStop,
  favoriteIds = [],
  onToggleFavorite,
  statuses = {},
  emptyMessage,
}) {
  const { t } = useLanguage();

  if (stores.length === 0) {
    return (
      <p className="px-1 text-sm text-neutral-500 dark:text-neutral-400">
        {emptyMessage || t("sidebar.noResults")}
      </p>
    );
  }

  const routeFull = routeStopIds.length >= MAX_ROUTE_STOPS;

  return (
    <ul className="flex flex-col gap-2">
      {stores.map((store) => {
        const isSelected = store.id === selectedStoreId;
        const inRoute = routeStopIds.includes(store.id);
        return (
          <li key={store.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectStore(store.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelectStore(store.id);
              }}
              className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-amber-600 dark:bg-amber-600 dark:text-neutral-950"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-300 hover:bg-amber-50/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-amber-500 dark:hover:bg-neutral-800/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {onToggleRouteStop && (
                    <RouteCheckbox
                      inRoute={inRoute}
                      disabled={!inRoute && routeFull}
                      onToggle={() => onToggleRouteStop(store)}
                      t={t}
                    />
                  )}
                  <span className="mt-1.5 shrink-0">
                    <StatusDot status={statuses[store.id]} />
                  </span>
                  <p className="truncate font-serif text-[15px] leading-snug">
                    {store.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {typeof store.distanceKm === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isSelected
                          ? "bg-white/15 text-white dark:bg-neutral-950/20 dark:text-neutral-950"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {formatDistanceKm(store.distanceKm)}
                    </span>
                  )}
                  {onToggleFavorite && (
                    <FavoriteButton
                      active={favoriteIds.includes(store.id)}
                      onToggle={() => onToggleFavorite(store.id)}
                    />
                  )}
                </div>
              </div>
              <p
                className={`mt-0.5 text-xs ${
                  isSelected
                    ? "text-neutral-300 dark:text-neutral-900"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {store.address}
              </p>
              <p
                className={`text-[11px] uppercase tracking-wide ${
                  isSelected
                    ? "text-neutral-400 dark:text-neutral-800"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {store.city}, {store.country}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {store.brands.map((brand) => {
                  const featured = FEATURED_BRANDS.includes(brand);
                  return (
                    <span
                      key={brand}
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                        featured
                          ? isSelected
                            ? "bg-amber-500 text-neutral-900"
                            : "bg-amber-700 text-white dark:bg-amber-700 dark:text-white"
                          : isSelected
                            ? "bg-white/15 text-amber-100 dark:bg-neutral-950/20 dark:text-neutral-900"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {brand}
                    </span>
                  );
                })}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
