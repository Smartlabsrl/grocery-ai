import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  latitude: number;
  longitude: number;
  label?: string;
  supermarkets?: any[];
  radius: number; // 👈 半径（单位：米）
}

/* ===========================
   计算两点之间距离（km）
=========================== */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/* ===========================
   自动缩放
=========================== */
function FitBounds({
  latitude,
  longitude,
  supermarkets,
}: {
  latitude: number;
  longitude: number;
  supermarkets?: any[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      [latitude, longitude],
      ...(supermarkets || []).map((s) => [s.latitude, s.longitude]),
    ];

    if (points.length === 1) {
      map.setView([latitude, longitude], 13);
      return;
    }

    const bounds = L.latLngBounds(points as any);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [latitude, longitude, supermarkets, map]);

  return null;
}

/* ===========================
   主组件
=========================== */
export function OpenMap({
  latitude,
  longitude,
  label,
  supermarkets = [],
  radius, // 👈 接收 radius
}: Props) {

  console.log("Circle radius:", radius); // 调试用

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 📍 当前用户位置 */}
        <Marker position={[latitude, longitude]}>
          <Popup>📍 {label}</Popup>
        </Marker>

        {/* 🔵 搜索半径圆 */}
        <Circle
          center={[latitude, longitude]}
          radius={radius}  // ✅ 正确使用传入的 radius（米）
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
          }}
        />

        {/* 🛒 附近超市 */}
        {supermarkets.map((market) => (
          <Marker
            key={market.id}
            position={[market.latitude, market.longitude]}
          >
            <Popup>
              🛒 {market.name}
              <br />
              {calculateDistance(
                latitude,
                longitude,
                market.latitude,
                market.longitude
              ).toFixed(2)} km away
            </Popup>
          </Marker>
        ))}

        {/* 自动缩放 */}
        <FitBounds
          latitude={latitude}
          longitude={longitude}
          supermarkets={supermarkets}
        />
      </MapContainer>
    </div>
  );
}
