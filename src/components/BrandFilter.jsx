import { FEATURED_BRANDS } from "../utils/brands";

function BrandChip({ brand, active, featured, onToggle }) {
  const activeClass = featured
    ? "border-amber-700 bg-amber-700 text-white"
    : "border-neutral-900 bg-neutral-900 text-white";
  const inactiveClass = featured
    ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500"
    : "border-neutral-300 text-neutral-600 hover:border-amber-400 hover:text-amber-700";

  return (
    <button
      type="button"
      onClick={() => onToggle(brand)}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
        active ? activeClass : inactiveClass
      }`}
    >
      {brand}
    </button>
  );
}

export default function BrandFilter({ brands, selected, onToggle, onClear }) {
  const featuredBrands = FEATURED_BRANDS.filter((brand) => brands.includes(brand));
  const otherBrands = brands.filter((brand) => !FEATURED_BRANDS.includes(brand));

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

      {featuredBrands.length > 0 && (
        <div className="mb-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Nos marques
          </p>
          <div className="flex flex-wrap gap-1.5">
            {featuredBrands.map((brand) => (
              <BrandChip
                key={brand}
                brand={brand}
                featured
                active={selected.includes(brand)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}

      {otherBrands.length > 0 && (
        <div>
          {featuredBrands.length > 0 && (
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Autres marques
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {otherBrands.map((brand) => (
              <BrandChip
                key={brand}
                brand={brand}
                featured={false}
                active={selected.includes(brand)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
