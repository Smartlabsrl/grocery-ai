import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Settings, 
  ShoppingCart, 
  Utensils,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Home as HomePage } from '@/pages/Home';
import { Settings as SettingsPage } from '@/pages/Settings';
import { SupermarketPage } from '@/pages/Supermarket';
import { RestaurantsPage } from '@/pages/Restaurants';
import { useAppStore } from '@/store/useAppStore';
import { useLocation } from '@/hooks/useLocation';
import { getGoogleMapsService } from '@/services/googleMaps';
import './App.css';

type Page = 'home' | 'settings' | 'supermarket' | 'restaurants';

function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { isFirstLaunch, setFirstLaunchComplete, selectedAddress, addresses, setSelectedAddress, googleMapsApiKey, currentLanguage } = useAppStore();
  const { getCurrentPosition } = useLocation();

  // Initialize language
  useEffect(() => {
    if (currentLanguage && i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  // Initialize Google Maps service
  useEffect(() => {
    if (googleMapsApiKey) {
      getGoogleMapsService(googleMapsApiKey);
    }
  }, [googleMapsApiKey]);

  // Initialize location on app start
  useEffect(() => {
    const initLocation = async () => {
      if (!selectedAddress && addresses.length > 0) {
        // Use default address if available
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        setSelectedAddress(defaultAddr);
      } else if (!selectedAddress) {
        // Try to get current location
        const currentLoc = await getCurrentPosition();
        if (currentLoc) {
          setSelectedAddress({
            id: 'current',
            name: 'Current Location',
            address: `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`,
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            isDefault: false,
          });
        }
      }
    };

    initLocation();
  }, []);

  // Handle first launch
  useEffect(() => {
    if (isFirstLaunch) {
      setCurrentPage('settings');
      setFirstLaunchComplete();
    }
  }, [isFirstLaunch, setFirstLaunchComplete]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'settings':
        return <SettingsPage />;
      case 'supermarket':
        return <SupermarketPage />;
      case 'restaurants':
        return <RestaurantsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {renderPage()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <NavButton
              icon={<Home className="w-5 h-5" />}
              label={t('nav.home')}
              isActive={currentPage === 'home'}
              onClick={() => setCurrentPage('home')}
            />
            <NavButton
              icon={<ShoppingCart className="w-5 h-5" />}
              label={t('nav.deals')}
              isActive={currentPage === 'supermarket'}
              onClick={() => setCurrentPage('supermarket')}
            />
            <div className="relative -top-5">
              <Button
                className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => setCurrentPage('home')}
              >
                <Sparkles className="w-6 h-6" />
              </Button>
            </div>
            <NavButton
              icon={<Utensils className="w-5 h-5" />}
              label={t('nav.dining')}
              isActive={currentPage === 'restaurants'}
              onClick={() => setCurrentPage('restaurants')}
            />
            <NavButton
              icon={<Settings className="w-5 h-5" />}
              label={t('nav.settings')}
              isActive={currentPage === 'settings'}
              onClick={() => setCurrentPage('settings')}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        isActive 
          ? 'text-green-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default App;
