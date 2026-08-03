import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapLegend from "./components/MapLegend";
import StoreDetailPanel from "./components/StoreDetailPanel";
import SecretCodeSettings from "./components/SecretCodeSettings";
import ChatWidget from "./components/ChatWidget";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function App() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);

  useEffect(() => {
    fetch("/stores.json")
      .then((res) => res.json())
      .then((data) => setStores(data));
  }, []);

  const allBrands = useMemo(() => {
    const set = new Set();
    stores.forEach((store) => store.brands.forEach((brand) => set.add(brand)));
    return [...set].sort();
  }, [stores]);

  const allCities = useMemo(() => {
    const set = new Set(stores.map((store) => store.city));
    return [...set].sort();
  }, [stores]);

  const hasActiveFilter =
    search.trim() !== "" || selectedCity !== "" || selectedBrands.length > 0;

  const filteredStores = useMemo(() => {
    if (!hasActiveFilter) return [];

    const query = normalize(search.trim());
    return stores.filter((store) => {
      const haystack = normalize(
        `${store.address} ${store.city} ${store.country}`,
      );
      const matchesSearch = query === "" || haystack.includes(query);
      const matchesCity = selectedCity === "" || store.city === selectedCity;
      const matchesBrands =
        selectedBrands.length === 0 ||
        store.brands.some((brand) => selectedBrands.includes(brand));
      return matchesSearch && matchesCity && matchesBrands;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, search, selectedCity, selectedBrands, hasActiveFilter]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  function handleSelectStore(id) {
    setSelectedStoreId(id);
    setDetailOpen(true);
  }

  function toggleBrand(brand) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-100">
      <Header onOpenSettings={() => setShowSettings(true)} />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          search={search}
          onSearchChange={setSearch}
          cities={allCities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          brands={allBrands}
          selectedBrands={selectedBrands}
          onToggleBrand={toggleBrand}
          onClearBrands={() => setSelectedBrands([])}
          stores={filteredStores}
          hasActiveFilter={hasActiveFilter}
          selectedStoreId={selectedStoreId}
          onSelectStore={handleSelectStore}
        />

        <div className="relative flex-1 bg-neutral-100 p-3 md:p-6">
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-lg">
            <MapView
              stores={filteredStores}
              selectedStoreId={selectedStoreId}
              selectedStore={selectedStore}
              onSelectStore={handleSelectStore}
              resizeTrigger={sidebarCollapsed}
            />

            {hasActiveFilter && filteredStores.length > 0 && <MapLegend />}

            {!hasActiveFilter && (
              <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
                <div className="pointer-events-auto max-w-sm rounded-xl border border-neutral-200 bg-white/95 px-6 py-5 text-center shadow-lg backdrop-blur">
                  <p className="font-serif text-lg text-neutral-900">
                    Trouvez un opticien Thélios
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Utilisez la recherche, une ville ou une marque dans le
                    panneau latéral pour afficher nos opticiens partenaires
                    en France.
                  </p>
                </div>
              </div>
            )}

            <StoreDetailPanel
              store={selectedStore}
              open={detailOpen && Boolean(selectedStore)}
              onClose={() => setDetailOpen(false)}
            />
          </div>
        </div>
      </div>

      {showSettings && (
        <SecretCodeSettings onClose={() => setShowSettings(false)} />
      )}

      <ChatWidget stores={stores} />
    </div>
  );
}

export default App;
