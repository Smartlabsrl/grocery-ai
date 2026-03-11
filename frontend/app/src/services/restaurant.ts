import type { Restaurant, CuisineType, OpeningHours } from '@/types';

// Mock data for restaurants
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Golden Dragon Chinese',
    cuisineType: ['chinese', 'asian'],
    address: '123 Alexanderplatz, 10178 Berlin, Germany',
    latitude: 52.5220,
    longitude: 13.4135,
    rating: 4.5,
    reviewCount: 328,
    priceRange: 2,
    isOpen: true,
    openingHours: {
      monday: { open: '11:30', close: '22:00' },
      tuesday: { open: '11:30', close: '22:00' },
      wednesday: { open: '11:30', close: '22:00' },
      thursday: { open: '11:30', close: '22:00' },
      friday: { open: '11:30', close: '23:00' },
      saturday: { open: '12:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' },
    },
    phone: '+49 30 12345678',
    website: 'https://goldendragon.example.com',
    deliveryAvailable: true,
    promotion: '20% off on orders over €30',
    featuredDishes: ['Kung Pao Chicken', 'Sweet & Sour Pork', 'Dim Sum Platter'],
  },
  {
    id: 'rest-2',
    name: 'Bella Italia',
    cuisineType: ['western'],
    address: '45 Friedrichstraße, 10117 Berlin, Germany',
    latitude: 52.5120,
    longitude: 13.3910,
    rating: 4.3,
    reviewCount: 256,
    priceRange: 3,
    isOpen: true,
    openingHours: {
      monday: { open: '12:00', close: '23:00' },
      tuesday: { open: '12:00', close: '23:00' },
      wednesday: { open: '12:00', close: '23:00' },
      thursday: { open: '12:00', close: '23:00' },
      friday: { open: '12:00', close: '24:00' },
      saturday: { open: '12:00', close: '24:00' },
      sunday: { open: '13:00', close: '22:00' },
    },
    phone: '+49 30 87654321',
    website: 'https://bellaitalia.example.com',
    deliveryAvailable: true,
    promotion: 'Free delivery on first order',
    featuredDishes: ['Margherita Pizza', 'Carbonara', 'Tiramisu'],
  },
  {
    id: 'rest-3',
    name: 'Green Garden Vegetarian',
    cuisineType: ['vegetarian', 'simple'],
    address: '78 Potsdamer Platz, 10785 Berlin, Germany',
    latitude: 52.5098,
    longitude: 13.3765,
    rating: 4.7,
    reviewCount: 189,
    priceRange: 2,
    isOpen: true,
    openingHours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '22:00' },
      saturday: { open: '10:00', close: '22:00' },
      sunday: { open: '11:00', close: '20:00' },
    },
    phone: '+49 30 11223344',
    website: 'https://greengarden.example.com',
    deliveryAvailable: true,
    promotion: 'Lunch special: 15% off 12-3pm',
    featuredDishes: ['Buddha Bowl', 'Avocado Toast', 'Green Smoothie'],
  },
  {
    id: 'rest-4',
    name: 'Fit Kitchen',
    cuisineType: ['fitness', 'simple'],
    address: '200 Unter den Linden, 10117 Berlin, Germany',
    latitude: 52.5168,
    longitude: 13.3885,
    rating: 4.6,
    reviewCount: 412,
    priceRange: 2,
    isOpen: true,
    openingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '09:00', close: '19:00' },
    },
    phone: '+49 30 55667788',
    website: 'https://fitkitchen.example.com',
    deliveryAvailable: true,
    promotion: 'Protein meal deal: €12.99',
    featuredDishes: ['Grilled Chicken Bowl', 'Salmon Power Bowl', 'Protein Pancakes'],
  },
  {
    id: 'rest-5',
    name: 'Sakura Sushi',
    cuisineType: ['asian', 'simple'],
    address: '15 Kurfürstendamm, 10719 Berlin, Germany',
    latitude: 52.5035,
    longitude: 13.3280,
    rating: 4.4,
    reviewCount: 298,
    priceRange: 3,
    isOpen: true,
    openingHours: {
      monday: { open: '12:00', close: '22:30' },
      tuesday: { open: '12:00', close: '22:30' },
      wednesday: { open: '12:00', close: '22:30' },
      thursday: { open: '12:00', close: '22:30' },
      friday: { open: '12:00', close: '23:30' },
      saturday: { open: '12:00', close: '23:30' },
      sunday: { open: '13:00', close: '22:00' },
    },
    phone: '+49 30 99887766',
    website: 'https://sakurasushi.example.com',
    deliveryAvailable: true,
    promotion: 'All-you-can-eat: €24.99',
    featuredDishes: ['Salmon Nigiri', 'Dragon Roll', 'Miso Soup'],
  },
  {
    id: 'rest-6',
    name: 'Kebab House Halal',
    cuisineType: ['simple'],
    address: '56 Warschauer Straße, 10243 Berlin, Germany',
    latitude: 52.5050,
    longitude: 13.4490,
    rating: 4.2,
    reviewCount: 567,
    priceRange: 1,
    isOpen: true,
    openingHours: {
      monday: { open: '10:00', close: '02:00' },
      tuesday: { open: '10:00', close: '02:00' },
      wednesday: { open: '10:00', close: '02:00' },
      thursday: { open: '10:00', close: '02:00' },
      friday: { open: '10:00', close: '04:00' },
      saturday: { open: '10:00', close: '04:00' },
      sunday: { open: '11:00', close: '01:00' },
    },
    phone: '+49 30 33445566',
    website: 'https://kebabhouse.example.com',
    deliveryAvailable: true,
    promotion: 'Family deal: 4 wraps for €20',
    featuredDishes: ['Doner Kebab', 'Falafel Wrap', 'Mixed Grill Plate'],
  },
];

export class RestaurantService {
  private restaurants: Restaurant[] = MOCK_RESTAURANTS;

  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private isCurrentlyOpen(openingHours: OpeningHours): boolean {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const hours = openingHours[currentDay];
    
    if (!hours) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  async getNearbyRestaurants(
    latitude: number,
    longitude: number,
    options: {
      radius?: number;
      cuisineType?: CuisineType[];
      priceRange?: number[];
      openNow?: boolean;
      deliveryOnly?: boolean;
      minRating?: number;
    } = {}
  ): Promise<Restaurant[]> {
    const {
      radius = 10,
      cuisineType,
      priceRange,
      openNow = false,
      deliveryOnly = false,
      minRating = 0,
    } = options;

    let results = this.restaurants
      .map(r => ({
        ...r,
        distance: this.calculateDistance(latitude, longitude, r.latitude, r.longitude),
        isOpen: this.isCurrentlyOpen(r.openingHours)
      }))
      .filter(r => r.distance! <= radius)
      .filter(r => r.rating >= minRating);

    if (cuisineType && cuisineType.length > 0) {
      results = results.filter(r => 
        r.cuisineType.some(c => cuisineType.includes(c))
      );
    }

    if (priceRange && priceRange.length > 0) {
      results = results.filter(r => priceRange.includes(r.priceRange));
    }

    if (openNow) {
      results = results.filter(r => r.isOpen);
    }

    if (deliveryOnly) {
      results = results.filter(r => r.deliveryAvailable);
    }

    // Sort by distance and rating
    return results.sort((a, b) => {
      const distanceDiff = a.distance! - b.distance!;
      if (distanceDiff !== 0) return distanceDiff;
      return b.rating - a.rating;
    });
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const restaurant = this.restaurants.find(r => r.id === id);
    if (!restaurant) return null;
    
    return {
      ...restaurant,
      isOpen: this.isCurrentlyOpen(restaurant.openingHours)
    };
  }

  async searchRestaurants(
    latitude: number,
    longitude: number,
    query: string
  ): Promise<Restaurant[]> {
    const lowerQuery = query.toLowerCase();
    return this.restaurants
      .map(r => ({
        ...r,
        distance: this.calculateDistance(latitude, longitude, r.latitude, r.longitude),
        isOpen: this.isCurrentlyOpen(r.openingHours)
      }))
      .filter(r => 
        r.name.toLowerCase().includes(lowerQuery) ||
        r.cuisineType.some(c => c.toLowerCase().includes(lowerQuery)) ||
        r.featuredDishes?.some(d => d.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => a.distance! - b.distance!);
  }

  getPriceRangeSymbol(range: number): string {
    return '€'.repeat(range);
  }

  async getRecommendedRestaurants(
    latitude: number,
    longitude: number,
    preferredCuisines: CuisineType[] = []
  ): Promise<Restaurant[]> {
    return this.getNearbyRestaurants(latitude, longitude, {
      radius: 5,
      cuisineType: preferredCuisines.length > 0 ? preferredCuisines : undefined,
      openNow: true,
      minRating: 4.0,
    });
  }
}

// Singleton instance
let restaurantServiceInstance: RestaurantService | null = null;

export function getRestaurantService(): RestaurantService {
  if (!restaurantServiceInstance) {
    restaurantServiceInstance = new RestaurantService();
  }
  return restaurantServiceInstance;
}
