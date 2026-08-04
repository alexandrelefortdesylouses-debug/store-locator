import { isFeaturedStore } from "./brands";
import { getStoreRegion } from "./regions";

export function computeNetworkStats(stores) {
  const total = stores.length;
  const thelios = stores.filter(isFeaturedStore).length;
  const competitorOnly = total - thelios;
  const penetrationRate = total > 0 ? (thelios / total) * 100 : 0;

  const byRegion = new Map();
  const byCity = new Map();

  stores.forEach((store) => {
    const region = getStoreRegion(store);
    const featured = isFeaturedStore(store);

    if (region) {
      const entry = byRegion.get(region) || { label: region, thelios: 0, competitor: 0 };
      if (featured) entry.thelios += 1;
      else entry.competitor += 1;
      byRegion.set(region, entry);
    }

    const cityEntry = byCity.get(store.city) || {
      label: store.city,
      thelios: 0,
      competitor: 0,
    };
    if (featured) cityEntry.thelios += 1;
    else cityEntry.competitor += 1;
    byCity.set(store.city, cityEntry);
  });

  const withTotal = (entry) => ({ ...entry, total: entry.thelios + entry.competitor });

  const regionBreakdown = [...byRegion.values()]
    .map(withTotal)
    .sort((a, b) => b.total - a.total);

  const cityBreakdown = [...byCity.values()]
    .map(withTotal)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    total,
    thelios,
    competitorOnly,
    penetrationRate,
    regionBreakdown,
    cityBreakdown,
  };
}
