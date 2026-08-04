import { haversineDistanceKm } from "./geo";

export const MAX_ROUTE_STOPS = 4;

function permutations(items) {
  if (items.length <= 1) return [items];
  const result = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    permutations(rest).forEach((perm) => result.push([item, ...perm]));
  });
  return result;
}

// Brute-forces the shortest visiting order for up to MAX_ROUTE_STOPS stores
// (at most 4! = 24 permutations, trivial to evaluate exhaustively), optionally
// starting from a fixed origin (the visitor's geolocated position).
export function optimizeRouteOrder(stores, origin) {
  if (stores.length === 0) return { order: [], totalDistanceKm: 0 };
  if (stores.length === 1) {
    const totalDistanceKm = origin
      ? haversineDistanceKm(origin.lat, origin.lng, stores[0].lat, stores[0].lng)
      : 0;
    return { order: stores, totalDistanceKm };
  }

  let bestOrder = stores;
  let bestDistance = Infinity;

  for (const perm of permutations(stores)) {
    let distance = 0;
    let prevLat = origin?.lat;
    let prevLng = origin?.lng;

    for (const store of perm) {
      if (prevLat !== undefined) {
        distance += haversineDistanceKm(prevLat, prevLng, store.lat, store.lng);
      }
      prevLat = store.lat;
      prevLng = store.lng;
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      bestOrder = perm;
    }
  }

  return { order: bestOrder, totalDistanceKm: bestDistance };
}

export function buildGoogleMapsUrl(order, origin) {
  const points = order.map((store) => `${store.lat},${store.lng}`);
  const originPoint = origin ? `${origin.lat},${origin.lng}` : points[0];
  const stops = origin ? points : points.slice(1);
  const destination = stops[stops.length - 1] ?? originPoint;
  const waypoints = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    origin: originPoint,
    destination,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Waze's URL scheme only supports a single destination, so this links to the
// first stop of the optimized route.
export function buildWazeUrl(order) {
  const firstStop = order[0];
  if (!firstStop) return "";
  const params = new URLSearchParams({
    ll: `${firstStop.lat},${firstStop.lng}`,
    navigate: "yes",
  });
  return `https://waze.com/ul?${params.toString()}`;
}
