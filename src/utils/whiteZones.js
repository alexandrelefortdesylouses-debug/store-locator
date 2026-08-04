import { isFeaturedStore } from "./brands";

// Cities with zero Thélios-brand presence but a meaningful number of
// competitor opticians already trading there — i.e. a market that exists
// (customers, footfall, competitor investment) but where Thélios brands
// have no foothold yet. Below this threshold a city is more likely just a
// single unrelated shop than an actual prospecting opportunity.
const MIN_COMPETITOR_COUNT = 5;

// Always computed from the full, unfiltered network — this is a prospecting
// analysis ("where should I go find new business"), not a view of the
// currently filtered/selected stores, so it stays meaningful regardless of
// whatever the user has narrowed the map down to.
export function computeWhiteZones(stores, minCompetitors = MIN_COMPETITOR_COUNT) {
  const byCity = new Map();

  stores.forEach((store) => {
    const entry = byCity.get(store.city) || {
      city: store.city,
      country: store.country,
      total: 0,
      thelios: 0,
      latSum: 0,
      lngSum: 0,
    };
    entry.total += 1;
    if (isFeaturedStore(store)) entry.thelios += 1;
    entry.latSum += store.lat;
    entry.lngSum += store.lng;
    byCity.set(store.city, entry);
  });

  return [...byCity.values()]
    .filter((entry) => entry.thelios === 0 && entry.total >= minCompetitors)
    .map((entry) => ({
      city: entry.city,
      country: entry.country,
      total: entry.total,
      lat: entry.latSum / entry.total,
      lng: entry.lngSum / entry.total,
    }))
    .sort((a, b) => b.total - a.total);
}
