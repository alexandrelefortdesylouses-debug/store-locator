import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { isFeaturedStore } from "../utils/brands";

const WORLD_CENTER = [20, 10];
const WORLD_ZOOM = 2;

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

function FlyToSelected({ store }) {
  const map = useMap();

  useEffect(() => {
    if (store) {
      map.flyTo([store.lat, store.lng], 14, { duration: 0.8 });
    }
  }, [store, map]);

  return null;
}

function FitBoundsToStores({ stores }) {
  const map = useMap();

  useEffect(() => {
    if (stores.length === 0) {
      map.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.6 });
      return;
    }
    if (stores.length === 1) {
      map.flyTo([stores[0].lat, stores[0].lng], 12, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, map]);

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
}) {
  return (
    <MapContainer
      center={WORLD_CENTER}
      zoom={WORLD_ZOOM}
      scrollWheelZoom={true}
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsToStores stores={stores} />
      <FlyToSelected store={selectedStore} />
      <InvalidateOnResize trigger={resizeTrigger} />
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
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
