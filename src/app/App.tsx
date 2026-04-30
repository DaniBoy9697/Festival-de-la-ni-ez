import { useState, useEffect } from 'react';
import { createClient } from '/utils/supabase/client';
import { publicAnonKey, supabaseFunctionsBaseUrl } from '/utils/supabase/info';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Activities from './components/Activities';
import Map from './components/Map';

interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string | null;
  location: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  attendsInterclubes: boolean;
}

interface Location {
  lat: number;
  lng: number;
  name: string;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<{
    service: Location;
    interclubes: Location;
  }>({
    service: { lat: 14.6349, lng: -90.5069, name: 'Ciudad de Guatemala' },
    interclubes: { lat: 14.6349, lng: -90.5069, name: 'Ciudad de Guatemala' },
  });
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error checking session:', error);
          setCheckingSession(false);
          return;
        }

        if (data.session?.access_token) {
          setAccessToken(data.session.access_token);
          await fetchUserProfile(data.session.access_token);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(
        `${supabaseFunctionsBaseUrl}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error fetching profile');
      }

      const profile = await response.json();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fetch activities
  const fetchActivities = async (token: string) => {
    setLoadingActivities(true);
    try {
      const response = await fetch(
        `${supabaseFunctionsBaseUrl}/activities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error fetching activities');
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await fetch(
        `${supabaseFunctionsBaseUrl}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error fetching locations');
      }

      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch data when authenticated
  useEffect(() => {
    if (accessToken && userProfile) {
      fetchActivities(accessToken);
      fetchLocations();
    }
  }, [accessToken, userProfile]);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    fetchUserProfile(token);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAccessToken(null);
    setUserProfile(null);
    setCurrentPage('dashboard');
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EBB205] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!accessToken || !userProfile) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Render main app
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        showInterclubes={userProfile.attendsInterclubes}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'dashboard' && (
          <Dashboard
            userName={userProfile.name}
            attendsInterclubes={userProfile.attendsInterclubes}
            activitiesCount={activities.length}
          />
        )}

        {currentPage === 'activities' && (
          <Activities activities={activities} loading={loadingActivities} />
        )}

        {currentPage === 'service' && (
          <Map
            lat={locations.service.lat}
            lng={locations.service.lng}
            name={locations.service.name}
            type="service"
          />
        )}

        {currentPage === 'interclubes' && userProfile.attendsInterclubes && (
          <Map
            lat={locations.interclubes.lat}
            lng={locations.interclubes.lng}
            name={locations.interclubes.name}
            type="interclubes"
          />
        )}
      </main>
    </div>
  );
}