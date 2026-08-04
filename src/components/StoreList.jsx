import { FEATURED_BRANDS } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";
import { useLanguage } from "../i18n/LanguageContext";

export default function StoreList({ stores, selectedStoreId, onSelectStore }) {
  const { t } = useLanguage();

  if (stores.length === 0) {
    return (
      <p className="px-1 text-sm text-neutral-500">{t("sidebar.noResults")}</p>
    );
  }

  return (
    <ul className="thin-scrollbar flex h-full flex-col gap-2 overflow-y-auto pr-1">
      {stores.map((store) => {
        const isSelected = store.id === selectedStoreId;
        return (
          <li key={store.id}>
            <button
              type="button"
              onClick={() => onSelectStore(store.id)}
              className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-300 hover:bg-amber-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-[15px] leading-snug">
                  {store.name}
                </p>
                {typeof store.distanceKm === "number" && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {formatDistanceKm(store.distanceKm)}
                  </span>
                )}
              </div>
              <p
                className={`mt-0.5 text-xs ${
                  isSelected ? "text-neutral-300" : "text-neutral-500"
                }`}
              >
                {store.address}
              </p>
              <p
                className={`text-[11px] uppercase tracking-wide ${
                  isSelected ? "text-neutral-400" : "text-neutral-400"
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
                            : "bg-amber-700 text-white"
                          : isSelected
                            ? "bg-white/15 text-amber-100"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {brand}
                    </span>
                  );
                })}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
