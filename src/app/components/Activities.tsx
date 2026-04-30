import { Clock, MapPin, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string | null;
  location: string;
}

interface ActivitiesProps {
  activities: Activity[];
  loading: boolean;
}

export default function Activities({ activities, loading }: ActivitiesProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EBB205] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay actividades aún</h3>
        <p className="text-gray-500">Las actividades se publicarán pronto</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#EBB205] to-[#d9a005] rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Programa de Actividades</h1>
        <p className="opacity-90">Festival de la Niñez 2026</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-3">{activity.title}</h3>

            {activity.description && (
              <p className="text-gray-600 mb-4">{activity.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5 text-[#EBB205]" />
                <span className="font-medium">
                  {formatTime(activity.startTime)}
                  {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-[#EBB205]" />
                <span className="text-sm">{formatDate(activity.startTime)}</span>
              </div>

              {activity.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-[#EBB205]" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
