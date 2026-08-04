import SearchBar from "./SearchBar";
import CitySelect from "./CitySelect";
import RegionSelect from "./RegionSelect";
import DepartmentSelect from "./DepartmentSelect";
import BrandFilter from "./BrandFilter";
import StoreTypeFilter from "./StoreTypeFilter";
import StoreList from "./StoreList";
import { useLanguage } from "../i18n/LanguageContext";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  allStores,
  cities,
  selectedCities,
  onCitiesChange,
  regions,
  selectedRegions,
  onRegionsChange,
  departments,
  selectedDepartments,
  onDepartmentsChange,
  brands,
  selectedBrands,
  onToggleBrand,
  selectedStoreTypes,
  onToggleStoreType,
  stores,
  hasActiveFilter,
  onResetFilters,
  onExport,
  exporting,
  selectedStoreId,
  onSelectStore,
  routeStopIds,
  onToggleRouteStop,
}) {
  const { t } = useLanguage();

  return (
    <aside
      className={`relative h-full shrink-0 border-b border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900 md:border-b-0 md:border-r ${
        collapsed ? "md:w-16" : "md:w-[340px]"
      } w-full overflow-hidden`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-10 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 md:flex"
        aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <div className="hidden h-full flex-col items-center gap-2 pt-6 text-neutral-400 dark:text-neutral-500 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">
            {t("sidebar.collapsedLabel")}
          </span>
        </div>
      ) : (
        <div className="thin-scrollbar flex h-full flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center justify-between gap-2">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              stores={allStores}
              onSelectStore={onSelectStore}
            />
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="cursor-pointer self-start rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
            >
              {t("sidebar.resetFilters")}
            </button>
          )}

          <RegionSelect
            regions={regions}
            selected={selectedRegions}
            onChange={onRegionsChange}
          />
          <DepartmentSelect
            departments={departments}
            selected={selectedDepartments}
            onChange={onDepartmentsChange}
          />
          <CitySelect cities={cities} selected={selectedCities} onChange={onCitiesChange} />
          <BrandFilter
            brands={brands}
            selected={selectedBrands}
            onToggle={onToggleBrand}
          />
          <StoreTypeFilter
            selected={selectedStoreTypes}
            onToggle={onToggleStoreType}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {hasActiveFilter ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {t("sidebar.opticianCount", { count: stores.length })}
                  </p>
                  {stores.length > 0 && (
                    <button
                      type="button"
                      onClick={onExport}
                      disabled={exporting}
                      className="cursor-pointer rounded-full px-2 py-1 text-xs text-amber-700 hover:underline disabled:cursor-wait disabled:opacity-60 dark:text-amber-400"
                    >
                      {t("sidebar.export")}
                    </button>
                  )}
                </div>
                <StoreList
                  stores={stores}
                  selectedStoreId={selectedStoreId}
                  onSelectStore={onSelectStore}
                  routeStopIds={routeStopIds}
                  onToggleRouteStop={onToggleRouteStop}
                />
              </>
            ) : (
              <p className="px-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t("sidebar.emptyPrompt")}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
