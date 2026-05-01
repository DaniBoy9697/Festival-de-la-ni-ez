import { Calendar, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import FestivalLogo from './FestivalLogo';
import {
  LOCATIONS,
  PINTEREST_OUTFIT_URL,
  ESSENTIALS,
  ITINERARY_SUMMARY,
  INTERCLUBES_BLURB,
} from '@/constants/event';

interface DashboardProps {
  userName: string;
  attendsInterclubes: boolean;
  activitiesCount: number;
}

export default function Dashboard({ userName, attendsInterclubes, activitiesCount }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-[#EBB205]/25 shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(#ccc_1px,transparent_1px),linear-gradient(90deg,#ccc_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-3 right-4 text-2xl select-none" aria-hidden>
          ✨ 🚀 ⭐
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-8">
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <FestivalLogo className="h-24 sm:h-28 w-auto max-w-[220px]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-[#EBB205] flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-4 h-4" aria-hidden />
              Festival de la Niñez 2026
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              ¡Hola, {userName}! <span aria-hidden>👩‍🚀</span>
            </h1>
            <p className="text-gray-600 mt-2 max-w-xl mx-auto sm:mx-0">
              {attendsInterclubes
                ? 'Tu guía espacial del evento: actividades, ubicaciones y recomendaciones Rotaract Cuautla Segundo Centenario.'
                : 'Tu guía del festival: actividades y ubicación del servicio — Rotaract Cuautla Segundo Centenario.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA mapas */}
      <section className="rounded-2xl bg-gradient-to-br from-[#EBB205] to-[#d4a004] p-6 text-white shadow-md">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <span aria-hidden>📍</span> Llegar con Google Maps
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={LOCATIONS.service.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#b8860b] font-semibold px-5 py-3 shadow hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-5 h-5 shrink-0" aria-hidden />
            Servicio — Escuela CONAFE
            <ExternalLink className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
          </a>
          {attendsInterclubes && (
            <a
              href={LOCATIONS.interclubes.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#b8860b] font-semibold px-5 py-3 shadow hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-5 h-5 shrink-0" aria-hidden />
              Interclubes — Paraíso Tlahuica
              <ExternalLink className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
            </a>
          )}
        </div>
        <p className="text-sm text-white/90 mt-3">
          {LOCATIONS.service.shortLabel}: {LOCATIONS.service.address}
          {attendsInterclubes && (
            <>
              <br />
              {LOCATIONS.interclubes.shortLabel}: {LOCATIONS.interclubes.address}
            </>
          )}
        </p>
      </section>

      {/* Stats: fechas interclubes solo si aplica */}
      <div
        className={`grid gap-4 ${attendsInterclubes ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-[#EBB205]/15 rounded-xl">
            <Calendar className="w-7 h-7 text-[#EBB205]" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tus actividades</p>
            <p className="text-2xl font-bold text-gray-900">{activitiesCount}</p>
          </div>
        </div>
        {attendsInterclubes && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-[#EBB205]/15 rounded-xl text-2xl" aria-hidden>
              🪐
            </div>
            <div>
              <p className="text-sm text-gray-600">Fechas Interclubes</p>
              <p className="text-lg font-semibold text-gray-900 leading-snug">1 – 3 de mayo 2026</p>
            </div>
          </div>
        )}
      </div>

      {/* Indispensables + outfit — solo participantes en interclubes */}
      {attendsInterclubes && (
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span aria-hidden>🎒</span> Recomendaciones — Indispensables
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Todo lo que conviene llevar para estar cómodo en el evento y en el hospedaje.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ESSENTIALS.map((item, i) => (
              <li
                key={item}
                className={`rounded-xl px-4 py-3 text-sm font-medium text-gray-800 ${
                  i % 2 === 0 ? 'bg-[#EBB205]/20' : 'bg-[#EBB205]/10'
                }`}
              >
                <span className="mr-2" aria-hidden>
                  {i % 2 === 0 ? '🌟' : '⭐'}
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-[#EBB205]/30 bg-[#EBB205]/5 p-4">
            <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span aria-hidden>👗</span> Inspo outfit — fiesta temática
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Ideas de vestuario para la fiesta (¡incluye temática Bob Esponja el sábado por la noche!).
            </p>
            <a
              href={PINTEREST_OUTFIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#b8860b] font-semibold hover:underline"
            >
              Ver más ideas en Pinterest
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
      )}

      {/* Interclubes — solo contenido útil */}
      {attendsInterclubes && (
        <section className="rounded-2xl bg-white border border-[#EBB205]/25 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span aria-hidden>🏊</span> Sobre el Interclubes
          </h2>
          <p className="text-gray-700 mb-4">{INTERCLUBES_BLURB}</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <a
              href={LOCATIONS.interclubes.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EBB205] text-white font-semibold px-5 py-3 hover:bg-[#d4a004] transition-colors"
            >
              Abrir ubicación en Maps
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={LOCATIONS.interclubes.mapsShortLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#EBB205] text-[#b8860b] font-semibold px-5 py-3 hover:bg-[#EBB205]/10 transition-colors"
            >
              Guía del festival (PDF)
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-gray-500">{LOCATIONS.interclubes.address}</p>
        </section>
      )}

      {/* Itinerario — solo interclubes */}
      {attendsInterclubes && (
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span aria-hidden>🛰️</span> Itinerario Interclubes (resumen)
          </h2>
          <div className="space-y-5">
            {ITINERARY_SUMMARY.map((block) => (
              <div key={block.day}>
                <p className="font-semibold text-[#EBB205] mb-2">{block.day}</p>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {block.items.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden className="text-[#EBB205]">
                        •
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-gray-400 pb-4">
        Hecho con el corazón por Devcye 🚀
      </p>
    </div>
  );
}
