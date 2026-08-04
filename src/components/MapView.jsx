import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.heat";
import { isFeaturedStore } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";
import { GOLD_ACCENT, NEUTRAL_ACCENT, INK, PALE_GOLD, HEATMAP_GRADIENT } from "../utils/palette";
import { getHeatmapCalibration } from "../utils/heatmapCalibration";

const FRANCE_CENTER = [46.6, 2.4];
const FRANCE_ZOOM = 6;

const GOLD = GOLD_ACCENT;
const NEUTRAL = NEUTRAL_ACCENT;
const ROUTE_COLOR = "#2563eb";

const LIGHT_TILES = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
const DARK_TILES = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

function createPinIcon(color, selected) {
  const width = selected ? 34 : 26;
  const height = Math.round(width * 1.4);

  return L.divIcon({
    className: "",
    html: `
      <svg width="${width}" height="${height}" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z"
          fill="${color}"
          stroke="${selected ? "#111827" : "#ffffff"}"
          stroke-width="${selected ? 2 : 1.5}"
        />
        <circle cx="15" cy="15" r="6" fill="#ffffff" opacity="0.95" />
      </svg>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
}

const icons = {
  featuredDefault: createPinIcon(GOLD, false),
  featuredSelected: createPinIcon(GOLD, true),
  neutralDefault: createPinIcon(NEUTRAL, false),
  neutralSelected: createPinIcon(NEUTRAL, true),
};

function getIcon(store, selected) {
  const featured = isFeaturedStore(store);
  if (featured) {
    return selected ? icons.featuredSelected : icons.featuredDefault;
  }
  return selected ? icons.neutralSelected : icons.neutralDefault;
}

const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <div class="location-pulse-ring" style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;"></div>
      <div style="position:absolute;inset:6px;border-radius:9999px;background:#2563eb;border:2px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.15);"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function createRouteStopIcon(order) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:9999px;
        background:${ROUTE_COLOR};color:#ffffff;border:2px solid #ffffff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);font-weight:600;font-size:12px;
        font-family:ui-sans-serif,system-ui,sans-serif;
      ">${order}</div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 40 : 48;

  return L.divIcon({
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${INK};color:${PALE_GOLD};border:2px solid #ffffff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-family:ui-serif,Georgia,serif;font-size:${size < 40 ? 12 : 14}px;
    ">${count}</div>`,
    className: "",
    iconSize: [size, size],
  });
}

function FlyToSelected({ store }) {
  const map = useMap();

  useEffect(() => {
    if (store) {
      map.flyTo([store.lat, store.lng], 14, { duration: 0.8 });
    }
  }, [store, map]);

  return null;
}

function FlyToUserLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 12, { duration: 0.8 });
    }
  }, [location, map]);

  return null;
}

function FitBoundsToStores({ stores, disabled }) {
  const map = useMap();

  useEffect(() => {
    if (disabled) return;
    if (stores.length === 0) {
      map.flyTo(FRANCE_CENTER, FRANCE_ZOOM, { duration: 0.6 });
      return;
    }
    if (stores.length === 1) {
      map.flyTo([stores[0].lat, stores[0].lng], 12, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, disabled, map]);

  return null;
}

function InvalidateOnResize({ trigger }) {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 320);
    return () => clearTimeout(id);
  }, [trigger, map]);

  return null;
}

function HeatmapLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);
  const { radius, blur, minOpacity, intensity } = getHeatmapCalibration(points.length);
  const weightedPoints = points.map(([lat, lng]) => [lat, lng, intensity]);

  useEffect(() => {
    const layer = L.heatLayer(weightedPoints, {
      radius,
      blur,
      minOpacity,
      maxZoom: 12,
      gradient: HEATMAP_GRADIENT,
    });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      // leaflet.heat schedules redraws via requestAnimationFrame but never
      // cancels them on removal, so a pending frame can fire after the map
      // reference is gone and crash on `this._map.getSize()`. Cancel it first.
      if (layer._frame) {
        L.Util.cancelAnimFrame(layer._frame);
        layer._frame = null;
      }
      map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setOptions({ radius, blur, minOpacity });
    layer.setLatLngs(weightedPoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightedPoints, radius, blur, minOpacity]);

  return null;
}

export default function MapView({
  stores,
  selectedStoreId,
  selectedStore,
  onSelectStore,
  resizeTrigger,
  userLocation,
  heatmapActive,
  isDark,
  routeStops = [],
  routeOrder,
}) {
  const tiles = isDark ? DARK_TILES : LIGHT_TILES;
  const routeStopSet = new Set(routeStops.map((s) => s.id));
  const displayRouteStops = routeOrder || routeStops;

  const routePositions =
    routeOrder && routeOrder.length > 1
      ? [
          ...(userLocation ? [[userLocation.lat, userLocation.lng]] : []),
          ...routeOrder.map((store) => [store.lat, store.lng]),
        ]
      : null;

  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={FRANCE_ZOOM}
      scrollWheelZoom={true}
      className={`z-0 h-full w-full ${heatmapActive ? "heatmap-active" : ""}`}
    >
      <TileLayer attribution={tiles.attribution} url={tiles.url} />
      <FitBoundsToStores stores={stores} disabled={Boolean(userLocation)} />
      <FlyToSelected store={selectedStore} />
      <FlyToUserLocation location={userLocation} />
      <InvalidateOnResize trigger={resizeTrigger} />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
      )}

      {routePositions && (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: ROUTE_COLOR, weight: 4, opacity: 0.8, dashArray: "8 8" }}
        />
      )}
      {displayRouteStops.map((store, i) => (
        <Marker
          key={`route-${store.id}`}
          position={[store.lat, store.lng]}
          icon={createRouteStopIcon(i + 1)}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onSelectStore(store.id) }}
        />
      ))}

      {heatmapActive ? (
        <HeatmapLayer points={stores.map((store) => [store.lat, store.lng])} />
      ) : (
        <MarkerClusterGroup
          key={stores.length}
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom
        >
          {stores.map((store) => {
            if (routeStopSet.has(store.id)) return null;
            return (
              <Marker
                key={store.id}
                position={[store.lat, store.lng]}
                icon={getIcon(store, store.id === selectedStoreId)}
                eventHandlers={{
                  click: () => onSelectStore(store.id),
                }}
              >
                <Popup>
                  <strong>{store.name}</strong>
                  <br />
                  {store.address}
                  {typeof store.distanceKm === "number" && (
                    <>
                      <br />
                      <strong>{formatDistanceKm(store.distanceKm)}</strong>
                    </>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  );
}
