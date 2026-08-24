import { haversineDistanceKm } from "./geo";

// Below this size, brute-force every permutation (7! = 5,040, still fast
// enough to run synchronously on click). Above it, permutations blow up
// combinatorially, so a nearest-neighbor construction refined by 2-opt is
// used instead — not guaranteed optimal, but a well-established heuristic
// that gets close in practice and stays fast for tours of any realistic
// size (a rep's day, even a very long one, is a few dozen stops at most).
const EXACT_THRESHOLD = 7;
const TWO_OPT_MAX_PASSES = 25;

// Google's consumer directions URL only accepts a limited number of
// waypoints per request (origin + up to 23 waypoints + destination = 25
// points). Longer tours are split into consecutive legs that chain
// together — each leg's destination is the next leg's origin — so an
// unlimited number of stops still works, just as multiple links to open
// one after another.
const MAX_POINTS_PER_GOOGLE_MAPS_URL = 25;

function permutations(items) {
  if (items.length <= 1) return [items];
  const result = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    permutations(rest).forEach((perm) => result.push([item, ...perm]));
  });
  return result;
}

function routeDistance(order, origin) {
  let total = 0;
  let prevLat = origin?.lat;
  let prevLng = origin?.lng;
  for (const store of order) {
    if (prevLat !== undefined) {
      total += haversineDistanceKm(prevLat, prevLng, store.lat, store.lng);
    }
    prevLat = store.lat;
    prevLng = store.lng;
  }
  return total;
}

function exactOptimize(stores, origin) {
  let bestOrder = stores;
  let bestDistance = Infinity;

  for (const perm of permutations(stores)) {
    const distance = routeDistance(perm, origin);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestOrder = perm;
    }
  }

  return { order: bestOrder, totalDistanceKm: bestDistance };
}

// Greedily visits whichever remaining store is closest to the current
// position, starting from the origin if known (otherwise arbitrarily from
// the first store).
function nearestNeighborOrder(stores, origin) {
  const remaining = [...stores];
  const order = [];
  let prevLat = origin?.lat;
  let prevLng = origin?.lng;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((store, i) => {
      const distance =
        prevLat === undefined ? 0 : haversineDistanceKm(prevLat, prevLng, store.lat, store.lng);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    });
    const [chosen] = remaining.splice(bestIndex, 1);
    order.push(chosen);
    prevLat = chosen.lat;
    prevLng = chosen.lng;
  }

  return order;
}

function reversedBetween(order, i, j) {
  return [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
}

// Repeatedly reverses segments of the tour whenever doing so shortens the
// total distance, until no single reversal helps or the pass budget runs
// out — the classic 2-opt local search.
function twoOptImprove(initialOrder, origin) {
  let order = initialOrder;
  let bestDistance = routeDistance(order, origin);
  const n = order.length;

  for (let pass = 0; pass < TWO_OPT_MAX_PASSES; pass++) {
    let improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const candidate = reversedBetween(order, i, j);
        const candidateDistance = routeDistance(candidate, origin);
        if (candidateDistance < bestDistance - 1e-9) {
          order = candidate;
          bestDistance = candidateDistance;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  return { order, totalDistanceKm: bestDistance };
}

export function optimizeRouteOrder(stores, origin) {
  if (stores.length === 0) return { order: [], totalDistanceKm: 0 };
  if (stores.length === 1) {
    const totalDistanceKm = origin
      ? haversineDistanceKm(origin.lat, origin.lng, stores[0].lat, stores[0].lng)
      : 0;
    return { order: stores, totalDistanceKm };
  }

  if (stores.length <= EXACT_THRESHOLD) {
    return exactOptimize(stores, origin);
  }

  const initialOrder = nearestNeighborOrder(stores, origin);
  return twoOptImprove(initialOrder, origin);
}

function buildSingleGoogleMapsUrl(points) {
  if (points.length === 1) {
    const params = new URLSearchParams({
      api: "1",
      destination: points[0],
      travelmode: "driving",
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1);

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Returns an array of URLs rather than one: a single link once the tour fits
// within Google's waypoint limit, or several consecutive legs (each
// starting where the previous one ends) once it doesn't.
export function buildGoogleMapsUrls(order, origin) {
  const storePoints = order.map((store) => `${store.lat},${store.lng}`);
  const points = origin ? [`${origin.lat},${origin.lng}`, ...storePoints] : storePoints;

  if (points.length <= MAX_POINTS_PER_GOOGLE_MAPS_URL) {
    return [buildSingleGoogleMapsUrl(points)];
  }

  const urls = [];
  let start = 0;
  while (start < points.length - 1) {
    const end = Math.min(start + MAX_POINTS_PER_GOOGLE_MAPS_URL - 1, points.length - 1);
    urls.push(buildSingleGoogleMapsUrl(points.slice(start, end + 1)));
    start = end;
  }
  return urls;
}

// Waze's public URL scheme (https://waze.com/ul) only ever resolves a
// single destination, and always navigates from wherever the device
// actually is right now — there is no supported way to pass an origin
// (real or the saved default address), unlike Google Maps/Apple Maps
// below. Used as-is for single-store links (one destination is exactly
// what those need); buildWazeUrls below works around the limitation for
// multi-stop tours.
export function buildWazeUrl(order) {
  const firstStop = order[0];
  if (!firstStop) return "";
  const params = new URLSearchParams({
    ll: `${firstStop.lat},${firstStop.lng}`,
    navigate: "yes",
  });
  return `https://waze.com/ul?${params.toString()}`;
}

// Waze has no multi-stop URL parameter to fall back on, so a full tour is
// covered by opening one single-destination Waze link per stop in order
// instead — the same "chain of legs" idea buildGoogleMapsUrls uses once a
// tour is too long for one Google Maps link, just applied to every stop
// here since Waze's per-link limit is 1 rather than 25. Each leg still
// starts from the device's live location (see buildWazeUrl above), not
// the previous stop or any saved origin.
export function buildWazeUrls(order) {
  return order.map((store) => buildWazeUrl([store])).filter(Boolean);
}

// Apple Maps' URL scheme supports a full multi-stop tour by chaining
// destinations in `daddr` with literal `+to:` separators (documented in
// Apple's "Maps Links" reference, e.g. `daddr=A+to:B+to:C`) — unlike
// Waze, so the whole optimized order is encoded in one link, with `saddr`
// carrying the real origin (device GPS or the saved default address).
// Built by hand rather than via URLSearchParams: coordinates need no
// percent-encoding, and URLSearchParams would escape the separators'
// literal "+" to "%2B", which Apple's parser doesn't treat the same way.
// `saddr` is omitted when there's no known origin, letting Apple Maps
// fall back to the device's current location.
export function buildAppleMapsUrl(order, origin) {
  if (order.length === 0) return "";
  const daddr = order.map((store) => `${store.lat},${store.lng}`).join("+to:");
  const saddr = origin ? `&saddr=${origin.lat},${origin.lng}` : "";
  return `https://maps.apple.com/?daddr=${daddr}${saddr}&dirflg=d`;
}
