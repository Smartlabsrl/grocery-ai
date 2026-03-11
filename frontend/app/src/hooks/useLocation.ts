import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface UseLocationReturn {
  location: LocationState | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<LocationState | null>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<LocationState | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check permission first
      const permissionStatus = await Geolocation.checkPermissions();
      
      if (permissionStatus.location !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setError('Location permission denied');
          setIsLoading(false);
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const locationData: LocationState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [requestPermission]);

  // Get location on mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    location,
    error,
    isLoading,
    requestPermission,
    getCurrentPosition,
  };
}
