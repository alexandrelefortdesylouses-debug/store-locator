import { useState } from "react";
import SearchBar from "./SearchBar";
import CitySelect from "./CitySelect";
import RegionSelect from "./RegionSelect";
import DepartmentSelect from "./DepartmentSelect";
import BrandFilter from "./BrandFilter";
import StoreTypeFilter from "./StoreTypeFilter";
import AccordionSection from "./AccordionSection";
import StoreList from "./StoreList";
import { useLanguage } from "../i18n/LanguageContext";

const DEFAULT_OPEN_SECTIONS = {
  cities: true,
  departments: false,
  regions: false,
  storeType: false,
  brands: false,
};

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
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN_SECTIONS);

  function toggleSection(key) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex shrink-0 flex-col gap-3 p-4 pb-3">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              stores={allStores}
              onSelectStore={onSelectStore}
            />

            {hasActiveFilter && (
              <button
                type="button"
                onClick={onResetFilters}
                className="cursor-pointer self-start rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-amber-500 dark:hover:text-amber-400"
              >
                {t("sidebar.resetFilters")}
              </button>
            )}
          </div>

          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4">
            <div>
              <AccordionSection
                title={t("sidebar.citiesTitle")}
                count={selectedCities.length}
                open={openSections.cities}
                onToggle={() => toggleSection("cities")}
              >
                <CitySelect
                  cities={cities}
                  selected={selectedCities}
                  onChange={onCitiesChange}
                />
              </AccordionSection>

              <AccordionSection
                title={t("sidebar.departmentsTitle")}
                count={selectedDepartments.length}
                open={openSections.departments}
                onToggle={() => toggleSection("departments")}
              >
                <DepartmentSelect
                  departments={departments}
                  selected={selectedDepartments}
                  onChange={onDepartmentsChange}
                />
              </AccordionSection>

              <AccordionSection
                title={t("sidebar.regionsTitle")}
                count={selectedRegions.length}
                open={openSections.regions}
                onToggle={() => toggleSection("regions")}
              >
                <RegionSelect
                  regions={regions}
                  selected={selectedRegions}
                  onChange={onRegionsChange}
                />
              </AccordionSection>

              <AccordionSection
                title={t("sidebar.storeTypeTitle")}
                count={selectedStoreTypes.length}
                open={openSections.storeType}
                onToggle={() => toggleSection("storeType")}
              >
                <StoreTypeFilter selected={selectedStoreTypes} onToggle={onToggleStoreType} />
              </AccordionSection>

              <AccordionSection
                title={t("sidebar.brandsTitle")}
                count={selectedBrands.length}
                open={openSections.brands}
                onToggle={() => toggleSection("brands")}
              >
                <BrandFilter brands={brands} selected={selectedBrands} onToggle={onToggleBrand} />
              </AccordionSection>
            </div>

            <div className="py-4">
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
        </div>
      )}
    </aside>
  );
}
