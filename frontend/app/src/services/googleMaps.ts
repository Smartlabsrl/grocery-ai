// Google Maps API Service
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
}

export class GoogleMapsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Search for nearby supermarkets
  async searchNearbySupermarkets(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=supermarket&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results;
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Failed to search supermarkets:', error);
      return [];
    }
  }

  // Search for nearby restaurants
  async searchNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number = 5000,
    keyword?: string
  ): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${this.apiKey}`;
      
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results;
      } else {
        console.error('Google Places API error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Failed to search restaurants:', error);
      return [];
    }
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.apiKey) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,photos&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error('Failed to get place details:', error);
      return null;
    }
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Failed to geocode address:', error);
      return null;
    }
  }

  // Get photo URL
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!this.apiKey) return '';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  // Generate static map URL
  getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 600,
    height: number = 300
  ): string {
    if (!this.apiKey) return '';
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${this.apiKey}`;
  }

  // Calculate distance between two points
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Singleton instance
let googleMapsServiceInstance: GoogleMapsService | null = null;

export function getGoogleMapsService(apiKey?: string): GoogleMapsService {
  if (!googleMapsServiceInstance || apiKey) {
    googleMapsServiceInstance = new GoogleMapsService(apiKey);
  }
  return googleMapsServiceInstance;
}
