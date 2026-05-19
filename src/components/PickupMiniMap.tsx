import { MapView } from "./MapView";
import { KNO_AIRPORT } from "@/lib/mock-data";

export function PickupMiniMap({
  lat,
  lng,
  className = "h-32 w-full",
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  const center: [number, number] = [
    (lat + KNO_AIRPORT.lat) / 2,
    (lng + KNO_AIRPORT.lng) / 2,
  ];
  return (
    <MapView
      center={center}
      zoom={10}
      className={className}
      points={[
        { lat, lng, label: "Jemput" },
        { lat: KNO_AIRPORT.lat, lng: KNO_AIRPORT.lng, label: "KNO" },
      ]}
      route={[
        [lat, lng],
        [KNO_AIRPORT.lat, KNO_AIRPORT.lng],
      ]}
    />
  );
}
