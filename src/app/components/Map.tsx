import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  lat: number;
  lng: number;
  name: string;
  type: 'service' | 'interclubes';
}

export default function Map({ lat, lng, name, type }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Create custom icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${type === 'service' ? '#EBB205' : '#4CAF50'};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Add marker
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
    marker.bindPopup(`<strong>${name}</strong>`);

    // Update map view
    mapInstanceRef.current.setView([lat, lng], 15);

    // Cleanup marker on component unmount
    return () => {
      marker.remove();
    };
  }, [lat, lng, name, type]);

  const title = type === 'service' ? 'Ubicación del Servicio' : 'Ubicación de Interclubes';
  const color = type === 'service' ? '#EBB205' : '#4CAF50';

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-6 text-white"
        style={{ background: `linear-gradient(to right, ${color}, ${color}dd)` }}
      >
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="opacity-90">{name}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div
          ref={mapRef}
          className="w-full h-96"
        />
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-gray-700">
          <strong>Nota:</strong> Puedes hacer zoom y moverte por el mapa para explorar la zona.
        </p>
      </div>
    </div>
  );
}
