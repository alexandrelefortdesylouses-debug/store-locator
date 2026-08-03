export default function StoreList({ stores, selectedStoreId, onSelectStore }) {
  return (
    <ul className="flex flex-col gap-2 overflow-y-auto h-full pr-1">
      {stores.map((store) => {
        const isSelected = store.id === selectedStoreId;
        return (
          <li key={store.id}>
            <button
              type="button"
              onClick={() => onSelectStore(store.id)}
              className={`w-full text-left rounded-lg border p-3 transition cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {store.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {store.address}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
