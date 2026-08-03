export const FEATURED_BRANDS = ["Barton Perreira", "Vuarnet"];

export function isFeaturedStore(store) {
  return store.brands.some((brand) => FEATURED_BRANDS.includes(brand));
}
