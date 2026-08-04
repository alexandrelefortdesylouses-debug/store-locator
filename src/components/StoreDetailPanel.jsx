import { Fragment } from "react";
import ReviewSection from "./ReviewSection";
import { FEATURED_BRANDS } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";
import { useLanguage } from "../i18n/LanguageContext";

export default function StoreDetailPanel({ store, open, onClose }) {
  const { t } = useLanguage();

  if (!store) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;

  return (
    <div
      className={`thin-scrollbar absolute inset-y-0 right-0 z-[500] w-full max-w-md overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            {t("storeDetail.partner")}
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug text-neutral-900">
            {store.name}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{store.address}</p>
          <p className="mt-0.5 text-sm text-neutral-400">
            {store.city}, {store.country}
          </p>
          {typeof store.distanceKm === "number" && (
            <p className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {formatDistanceKm(store.distanceKm)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label={t("storeDetail.close")}
        >
          ✕
        </button>
      </div>

      <div className="p-5">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
                      : "border-amber-200 bg-amber-50 text-amber-800"
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("storeDetail.hours")}
            </p>
            <div className="grid max-w-sm grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.entries(store.hours).map(([day, hours]) => (
                <Fragment key={day}>
                  <span className="capitalize text-neutral-600">{day}</span>
                  <span className="text-right text-neutral-900">{hours}</span>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {(store.phone || store.email || store.website) && (
          <div className="mb-6 text-sm text-neutral-600">
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
                  className="text-amber-700 hover:underline"
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
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          {t("storeDetail.directions")}
          <span aria-hidden>→</span>
        </a>

        <ReviewSection storeId={store.id} />
      </div>
    </div>
  );
}
