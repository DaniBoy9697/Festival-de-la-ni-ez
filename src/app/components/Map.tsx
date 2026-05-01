import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink } from 'lucide-react';

interface MapProps {
  lat: number;
  lng: number;
  name: string;
  type: 'service' | 'interclubes';
  /** Si no se pasa, se construye con lat,lng */
  googleMapsUrl?: string;
}

export default function Map({ lat, lng, name, type, googleMapsUrl }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const directionsUrl =
    googleMapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
    }

    const accent = type === 'service' ? '#EBB205' : '#c9a008';

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${accent};
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
            font-size: 14px;
          ">🚀</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
    marker.bindPopup(`<strong>${name}</strong>`);

    mapInstanceRef.current.setView([lat, lng], 15);

    return () => {
      marker.remove();
    };
  }, [lat, lng, name, type]);

  const title = type === 'service' ? '🛰️ Ubicación del Servicio' : '🌙 Ubicación del Interclubes';
  const color = type === 'service' ? '#EBB205' : '#c9a008';

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-6 text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
        <p className="opacity-95 text-sm sm:text-base">{name}</p>
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-[#EBB205] hover:bg-[#d4a004] text-white font-semibold px-6 py-4 shadow-md transition-colors"
      >
        Abrir en Google Maps
        <ExternalLink className="w-5 h-5 shrink-0" aria-hidden />
      </a>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div ref={mapRef} className="w-full h-80 sm:h-96 z-0" />
      </div>

      <div className="rounded-xl p-4 bg-[#EBB205]/10 border border-[#EBB205]/25">
        <p className="text-sm text-gray-800 flex items-start gap-2">
          <span aria-hidden>⭐</span>
          <span>
            Puedes hacer zoom y mover el mapa. El botón de arriba te lleva directo a rutas en Google Maps.
          </span>
        </p>
      </div>
    </div>
  );
}
