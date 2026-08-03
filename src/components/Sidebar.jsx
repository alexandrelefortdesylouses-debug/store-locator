import SearchBar from "./SearchBar";
import BrandFilter from "./BrandFilter";
import StoreList from "./StoreList";

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  search,
  onSearchChange,
  brands,
  selectedBrands,
  onToggleBrand,
  onClearBrands,
  stores,
  selectedStoreId,
  onSelectStore,
}) {
  return (
    <aside
      className={`relative h-72 shrink-0 border-b border-neutral-200 bg-white transition-all duration-300 md:h-full md:border-b-0 md:border-r ${
        collapsed ? "md:w-16" : "md:w-[340px]"
      } w-full overflow-hidden`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-10 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600 md:flex"
        aria-label={collapsed ? "Afficher la liste" : "Réduire la liste"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <div className="hidden h-full flex-col items-center gap-2 pt-6 text-neutral-400 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">
            {stores.length} opticiens
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-4 p-4">
          <SearchBar value={search} onChange={onSearchChange} />
          <BrandFilter
            brands={brands}
            selected={selectedBrands}
            onToggle={onToggleBrand}
            onClear={onClearBrands}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {stores.length} opticien{stores.length > 1 ? "s" : ""}
            </p>
            <StoreList
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={onSelectStore}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
