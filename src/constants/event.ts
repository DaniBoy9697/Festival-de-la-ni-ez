/**
 * Datos del Festival de la Niñez 2026 — Rotaract Cuautla Segundo Centenario
 */

export const LOCATIONS = {
  service: {
    lat: 18.791228304118885,
    lng: -98.93417985766996,
    shortLabel: 'Escuela CONAFE',
    address: 'La Bisnaga, 62743 Cuautla, Mor.',
    /** Abrir en Google Maps con destino por coordenadas */
    googleMapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=18.791228304118885,-98.93417985766996',
  },
  interclubes: {
    lat: 18.757053847004872,
    lng: -98.83704925766997,
    shortLabel: 'Interclubes',
    address: 'Fraccionamiento Paraíso Tlahuica, Ayala, Morelos',
    googleMapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=18.757053847004872,-98.83704925766997',
    /** Enlace corto de la guía (alternativa) */
    mapsShortLink: 'https://maps.app.goo.gl/PYo9Tyh7Qo9uJCARB',
  },
} as const;

/** Logo estático en `public/img/logo.png` */
export const FESTIVAL_LOGO_URL = '/img/logo.png';

export const PINTEREST_OUTFIT_URL = 'https://pin.it/35FOIB0xl';

export const ESSENTIALS: string[] = [
  'Tenis y sandalias',
  'Toalla de baño',
  'Traje de baño',
  'Gorra o sombrero',
  'Bloqueador solar',
  'Ropa cómoda y fresca',
  'Repelente de insectos',
  'Shampoo',
  'Jabón corporal',
];

/** Resumen del itinerario (guía oficial — sin talleres del servicio escolar) */
export const ITINERARY_SUMMARY = [
  {
    day: 'Viernes 1 de mayo',
    items: [
      '18:00 — Llegada y asignación de cuartos',
      '19:00 — Dinámicas de integración y armado de bolsas',
      '21:00 — Cena de bienvenida',
      '00:00 — A mimir',
    ],
  },
  {
    day: 'Sábado 2 de mayo',
    items: [
      '07:30 — Traslado a la escuela',
      '08:00 — Organización pre-inauguración',
      '09:00 — Inauguración',
      '09:30 — Inicio de talleres y actividades',
      '12:00 — Comida',
      '15:30 — Entrega de juguetes, cierre de actividades y limpieza',
      '16:30 — Traslado al hospedaje',
      '17:30 — Alimentación',
      '18:00 — Tiempo libre y GRWM',
      '20:00 — Fiesta temática (Bob Esponja)',
      '22:30 — Cena',
    ],
  },
  {
    day: 'Domingo 3 de mayo',
    items: [
      '10:00 — Desayuno',
      '12:00 — Tiempo libre',
      '15:00 — Check out',
    ],
  },
];

export const INTERCLUBES_BLURB =
  'Después del servicio: hospedaje en casa privada con alberca, convivencia, comidas en común y fiesta temática. ¡Trae tu mejor outfit!';
