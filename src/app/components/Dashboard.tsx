import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface DashboardProps {
  userName: string;
  attendsInterclubes: boolean;
  activitiesCount: number;
}

export default function Dashboard({ userName, attendsInterclubes, activitiesCount }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#EBB205] to-[#d9a005] rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {userName}!</h1>
        <p className="text-lg opacity-90">Festival de la Niñez 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EBB205] bg-opacity-10 rounded-lg">
              <Calendar className="w-6 h-6 text-[#EBB205]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Actividades</p>
              <p className="text-2xl font-bold text-gray-800">{activitiesCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EBB205] bg-opacity-10 rounded-lg">
              <Users className="w-6 h-6 text-[#EBB205]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Interclubes</p>
              <p className="text-lg font-semibold text-gray-800">
                {attendsInterclubes ? 'Sí asistiré' : 'No asistiré'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EBB205] bg-opacity-10 rounded-lg">
              <Clock className="w-6 h-6 text-[#EBB205]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha del Evento</p>
              <p className="text-lg font-semibold text-gray-800">30 Abril 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Información del Evento</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#EBB205] mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">Ubicación del Servicio</p>
              <p className="text-sm text-gray-600">Consulta el mapa para ver la ubicación exacta</p>
            </div>
          </div>
          {attendsInterclubes && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#EBB205] mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">Ubicación de Interclubes</p>
                <p className="text-sm text-gray-600">Consulta el mapa de interclubes para más detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Prepárate para el Festival!</h3>
        <p className="text-gray-700">
          Revisa el horario de actividades y las ubicaciones en los mapas.
          ¡Será un día lleno de diversión y aprendizaje!
        </p>
      </div>
    </div>
  );
}
