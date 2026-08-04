import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapLegend from "./components/MapLegend";
import LocateMeButton from "./components/LocateMeButton";
import Dashboard from "./components/Dashboard";
import StoreDetailPanel from "./components/StoreDetailPanel";
import SecretCodeSettings from "./components/SecretCodeSettings";
import ChatWidget from "./components/ChatWidget";
import { getStoreRegion } from "./utils/regions";
import { haversineDistanceKm } from "./utils/geo";
import { storesToCsv, downloadCsv } from "./utils/csvExport";
import { useLanguage } from "./i18n/LanguageContext";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const NEAR_ME_LIMIT = 30;

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function App() {
  const { t } = useLanguage();
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [browseAll, setBrowseAll] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

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

  const allRegions = useMemo(() => {
    const set = new Set();
    stores.forEach((store) => {
      const region = getStoreRegion(store);
      if (region) set.add(region);
    });
    return [...set].sort();
  }, [stores]);

  const hasActiveFilter =
    search.trim() !== "" ||
    selectedCity !== "" ||
    selectedRegion !== "" ||
    selectedBrands.length > 0;

  const filteredStores = useMemo(() => {
    let base;
    if (hasActiveFilter) {
      const query = normalize(search.trim());
      base = stores.filter((store) => {
        const haystack = normalize(
          `${store.address} ${store.city} ${store.country}`,
        );
        const matchesSearch = query === "" || haystack.includes(query);
        const matchesCity = selectedCity === "" || store.city === selectedCity;
        const matchesRegion =
          selectedRegion === "" || getStoreRegion(store) === selectedRegion;
        const matchesBrands =
          selectedBrands.length === 0 ||
          store.brands.some((brand) => selectedBrands.includes(brand));
        return matchesSearch && matchesCity && matchesRegion && matchesBrands;
      });
    } else if (browseAll || userLocation) {
      base = stores;
    } else {
      base = [];
    }

    if (userLocation) {
      const withDistance = base
        .map((store) => ({
          ...store,
          distanceKm: haversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            store.lat,
            store.lng,
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      if (!hasActiveFilter && !browseAll) {
        return withDistance.slice(0, NEAR_ME_LIMIT);
      }
      return withDistance;
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stores,
    search,
    selectedCity,
    selectedRegion,
    selectedBrands,
    hasActiveFilter,
    browseAll,
    userLocation,
  ]);

  const selectedStoreBase = stores.find((s) => s.id === selectedStoreId);
  const selectedStore =
    selectedStoreBase && userLocation
      ? {
          ...selectedStoreBase,
          distanceKm: haversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            selectedStoreBase.lat,
            selectedStoreBase.lng,
          ),
        }
      : selectedStoreBase;
  const showResults = hasActiveFilter || browseAll || Boolean(userLocation);

  function handleSelectStore(id) {
    setSelectedStoreId(id);
    setDetailOpen(true);
  }

  function toggleBrand(brand) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  }

  function handleResetFilters() {
    setSearch("");
    setSelectedCity("");
    setSelectedRegion("");
    setSelectedBrands([]);
    setBrowseAll(false);
    setUserLocation(null);
    setGeoError(null);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setGeoError(t("geo.unsupported"));
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError(t("geo.denied"));
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleExport() {
    const headers = t("export.headers").split(",");
    const csv = storesToCsv(filteredStores, headers);
    downloadCsv(`thelios-opticiens-${filteredStores.length}.csv`, csv);
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-100">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          search={search}
          onSearchChange={setSearch}
          cities={allCities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          regions={allRegions}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          brands={allBrands}
          selectedBrands={selectedBrands}
          onToggleBrand={toggleBrand}
          stores={filteredStores}
          hasActiveFilter={showResults}
          onResetFilters={handleResetFilters}
          onExport={handleExport}
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
              userLocation={userLocation}
            />

            <LocateMeButton
              onLocate={handleLocateMe}
              active={Boolean(userLocation)}
              loading={geoLoading}
              error={geoError}
            />

            {showResults && filteredStores.length > 0 && <MapLegend />}

            {!showResults && (
              <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
                <div className="pointer-events-auto max-w-sm rounded-xl border border-neutral-200 bg-white/95 px-6 py-5 text-center shadow-lg backdrop-blur">
                  <p className="font-serif text-lg text-neutral-900">
                    {t("map.emptyTitle")}
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    {t("map.emptyBody")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBrowseAll(true)}
                    className="mt-4 cursor-pointer rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                  >
                    {t("map.freeMode")}
                  </button>
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

      {showStats && (
        <Dashboard stores={stores} onClose={() => setShowStats(false)} />
      )}

      <ChatWidget stores={stores} />
    </div>
  );
}

export default App;
