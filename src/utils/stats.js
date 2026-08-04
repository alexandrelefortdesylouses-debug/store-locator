import { isFeaturedStore, FEATURED_BRANDS } from "./brands";
import { getStoreRegion } from "./regions";
import { getStoreDepartment } from "./departments";
import { getStoreType, STORE_TYPES } from "./storeType";

const TYPE_ORDER = [STORE_TYPES.FLAGSHIP, STORE_TYPES.DEPARTMENT_STORE, STORE_TYPES.INDEPENDENT];

function withTotal(entry) {
  return { ...entry, total: entry.thelios + entry.competitor };
}

export function computeNetworkStats(stores) {
  const total = stores.length;
  const thelios = stores.filter(isFeaturedStore).length;
  const competitorOnly = total - thelios;
  const penetrationRate = total > 0 ? (thelios / total) * 100 : 0;

  const byRegion = new Map();
  const byDepartment = new Map();
  const byCity = new Map();
  const byBrand = new Map();
  const byType = new Map();

  stores.forEach((store) => {
    const featured = isFeaturedStore(store);

    const region = getStoreRegion(store);
    if (region) {
      const entry = byRegion.get(region) || { label: region, thelios: 0, competitor: 0 };
      if (featured) entry.thelios += 1;
      else entry.competitor += 1;
      byRegion.set(region, entry);
    }

    const dept = getStoreDepartment(store);
    if (dept) {
      const entry = byDepartment.get(dept.code) || {
        label: dept.label,
        thelios: 0,
        competitor: 0,
      };
      if (featured) entry.thelios += 1;
      else entry.competitor += 1;
      byDepartment.set(dept.code, entry);
    }

    const cityEntry = byCity.get(store.city) || {
      label: store.city,
      thelios: 0,
      competitor: 0,
    };
    if (featured) cityEntry.thelios += 1;
    else cityEntry.competitor += 1;
    byCity.set(store.city, cityEntry);

    store.brands.forEach((brand) => {
      byBrand.set(brand, (byBrand.get(brand) || 0) + 1);
    });

    const type = getStoreType(store);
    byType.set(type, (byType.get(type) || 0) + 1);
  });

  const regionBreakdown = [...byRegion.values()].map(withTotal).sort((a, b) => b.total - a.total);
  const departmentBreakdown = [...byDepartment.values()]
    .map(withTotal)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);
  const cityBreakdown = [...byCity.values()]
    .map(withTotal)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const brandBreakdown = [...byBrand.entries()]
    .map(([label, count]) => ({
      label,
      count,
      featured: FEATURED_BRANDS.includes(label),
      pct: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const typeBreakdown = TYPE_ORDER.map((type) => {
    const count = byType.get(type) || 0;
    return { type, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });

  return {
    total,
    thelios,
    competitorOnly,
    penetrationRate,
    regionBreakdown,
    departmentBreakdown,
    cityBreakdown,
    brandBreakdown,
    typeBreakdown,
  };
}
