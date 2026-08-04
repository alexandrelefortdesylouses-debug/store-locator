import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { isFeaturedStore } from "../utils/brands";
import { formatDistanceKm } from "../utils/geo";

const FRANCE_CENTER = [46.6, 2.4];
const FRANCE_ZOOM = 6;

const GOLD = "#b45309";
const NEUTRAL = "#57534e";

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

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 40 : 48;

  return L.divIcon({
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:9999px;
      background:#1c1917;color:#fbbf6b;border:2px solid #ffffff;
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

export default function MapView({
  stores,
  selectedStoreId,
  selectedStore,
  onSelectStore,
  resizeTrigger,
  userLocation,
}) {
  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={FRANCE_ZOOM}
      scrollWheelZoom={true}
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsToStores stores={stores} disabled={Boolean(userLocation)} />
      <FlyToSelected store={selectedStore} />
      <FlyToUserLocation location={userLocation} />
      <InvalidateOnResize trigger={resizeTrigger} />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
      )}
      <MarkerClusterGroup
        key={stores.length}
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={50}
        spiderfyOnMaxZoom
      >
        {stores.map((store) => (
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
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
