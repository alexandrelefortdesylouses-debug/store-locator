import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const WORLD_CENTER = [20, 10];
const WORLD_ZOOM = 2;

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [1, -44],
  shadowSize: [52, 52],
  className: "hue-rotate-[130deg] saturate-150",
});

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
          icon={store.id === selectedStoreId ? selectedIcon : defaultIcon}
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
