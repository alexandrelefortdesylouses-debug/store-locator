import SearchBar from "./SearchBar";
import CitySelect from "./CitySelect";
import RegionSelect from "./RegionSelect";
import BrandFilter from "./BrandFilter";
import StoreList from "./StoreList";
import { useLanguage } from "../i18n/LanguageContext";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  cities,
  selectedCity,
  onCityChange,
  regions,
  selectedRegion,
  onRegionChange,
  brands,
  selectedBrands,
  onToggleBrand,
  stores,
  hasActiveFilter,
  onResetFilters,
  onExport,
  exporting,
  selectedStoreId,
  onSelectStore,
}) {
  const { t } = useLanguage();

  return (
    <aside
      className={`relative h-80 shrink-0 border-b border-neutral-200 bg-white transition-all duration-300 md:h-full md:border-b-0 md:border-r ${
        collapsed ? "md:w-16" : "md:w-[340px]"
      } w-full overflow-hidden`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-10 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600 md:flex"
        aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <div className="hidden h-full flex-col items-center gap-2 pt-6 text-neutral-400 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">
            {t("sidebar.collapsedLabel")}
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <SearchBar value={search} onChange={onSearchChange} />
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="cursor-pointer self-start rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 transition hover:border-amber-400 hover:text-amber-700"
            >
              {t("sidebar.resetFilters")}
            </button>
          )}

          <RegionSelect
            regions={regions}
            value={selectedRegion}
            onChange={onRegionChange}
          />
          <CitySelect cities={cities} value={selectedCity} onChange={onCityChange} />
          <BrandFilter
            brands={brands}
            selected={selectedBrands}
            onToggle={onToggleBrand}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {hasActiveFilter ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {t("sidebar.opticianCount", { count: stores.length })}
                  </p>
                  {stores.length > 0 && (
                    <button
                      type="button"
                      onClick={onExport}
                      disabled={exporting}
                      className="cursor-pointer text-xs text-amber-700 hover:underline disabled:cursor-wait disabled:opacity-60"
                    >
                      {t("sidebar.export")}
                    </button>
                  )}
                </div>
                <StoreList
                  stores={stores}
                  selectedStoreId={selectedStoreId}
                  onSelectStore={onSelectStore}
                />
              </>
            ) : (
              <p className="px-1 text-sm leading-relaxed text-neutral-500">
                {t("sidebar.emptyPrompt")}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
