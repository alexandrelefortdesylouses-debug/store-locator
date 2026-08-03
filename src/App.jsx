import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
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

  const filteredStores = useMemo(() => {
    const query = normalize(search.trim());
    return stores.filter((store) => {
      const matchesSearch = query === "" || normalize(store.address).includes(query);
      const matchesBrands =
        selectedBrands.length === 0 ||
        store.brands.some((brand) => selectedBrands.includes(brand));
      return matchesSearch && matchesBrands;
    });
  }, [stores, search, selectedBrands]);

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
          brands={allBrands}
          selectedBrands={selectedBrands}
          onToggleBrand={toggleBrand}
          onClearBrands={() => setSelectedBrands([])}
          stores={filteredStores}
          selectedStoreId={selectedStoreId}
          onSelectStore={handleSelectStore}
        />

        <div className="relative flex-1">
          <MapView
            stores={filteredStores}
            selectedStoreId={selectedStoreId}
            selectedStore={selectedStore}
            onSelectStore={handleSelectStore}
          />
          <StoreDetailPanel
            store={selectedStore}
            open={detailOpen && Boolean(selectedStore)}
            onClose={() => setDetailOpen(false)}
          />
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
