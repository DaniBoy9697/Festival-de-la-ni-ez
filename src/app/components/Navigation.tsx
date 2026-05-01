import { Home, Calendar, MapPin, LogOut, Users } from 'lucide-react';
import FestivalLogo from './FestivalLogo';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  showInterclubes: boolean;
}

export default function Navigation({ currentPage, onNavigate, onLogout, showInterclubes }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'activities', label: 'Actividades', icon: Calendar },
    { id: 'service', label: 'Servicio', icon: MapPin },
  ];

  if (showInterclubes) {
    navItems.push({ id: 'interclubes', label: 'Interclubes', icon: Users });
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FestivalLogo className="h-10 w-auto max-h-10 max-w-[140px]" />
              <span className="font-bold text-gray-800 hidden sm:inline">Festival de la Niñez</span>
            </div>

            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-[#EBB205] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ml-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'text-[#EBB205]'
                  : 'text-gray-600'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-red-600"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs font-medium">Salir</span>
          </button>
        </div>
      </nav>
    </>
  );
}
