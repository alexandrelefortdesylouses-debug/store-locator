import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import StoreList from "./components/StoreList";
import StoreCard from "./components/StoreCard";
import SecretCodeSettings from "./components/SecretCodeSettings";

function App() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch("/stores.json")
      .then((res) => res.json())
      .then((data) => {
        setStores(data);
        if (data.length > 0) setSelectedStoreId(data[0].id);
      });
  }, []);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Store Locator
        </h1>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        >
          ⚙️ Paramètres
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1 h-[420px]">
            <StoreList
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={setSelectedStoreId}
            />
          </div>
          <div className="md:col-span-2 h-[420px]">
            <MapView
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStore={setSelectedStoreId}
            />
          </div>
        </div>

        <div className="mt-6">
          <StoreCard store={selectedStore} />
        </div>
      </main>

      {showSettings && (
        <SecretCodeSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
