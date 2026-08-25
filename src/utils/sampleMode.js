import { getStoreDeptCode } from "./postalCode";

// "Version Beta" — a hidden demo/sample mode toggled from a discreet
// bottom-left trigger (App.jsx), for presenting a small, curated slice of
// the network rather than the full one. Purely a display-time filter
// layered on top of the real `stores` array: nothing else in the app
// (map, sidebar filters, Mon Carnet…) needs to know this mode exists,
// since they all just keep consuming whatever `stores` currently holds.
export const SAMPLE_DEPARTMENT_CODE = "75";
export const SAMPLE_BRANDS = ["Vuarnet", "Maui Jim", "Julbo"];

// A store with none of the sample brands left after filtering is dropped
// entirely — an empty brand list wouldn't make sense in a demo meant to
// showcase exactly these three brands.
export function applySampleFilter(stores) {
  return stores
    .filter((store) => getStoreDeptCode(store) === SAMPLE_DEPARTMENT_CODE)
    .map((store) => ({ ...store, brands: store.brands.filter((b) => SAMPLE_BRANDS.includes(b)) }))
    .filter((store) => store.brands.length > 0);
}
