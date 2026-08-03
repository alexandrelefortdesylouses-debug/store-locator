export default function BrandFilter({ brands, selected, onToggle, onClear }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Marques
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs text-amber-700 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {brands.map((brand) => {
          const active = selected.includes(brand);
          return (
            <button
              key={brand}
              type="button"
              onClick={() => onToggle(brand)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700"
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}
