import type { Supermarket, DiscountItem, FoodCategory } from '@/types';

// Mock data for European supermarkets
const MOCK_SUPERMARKETS: Supermarket[] = [
  {
    id: 'lidl-1',
    name: 'Lidl Berlin Mitte',
    chain: 'lidl',
    address: 'Alexanderplatz 1, 10178 Berlin, Germany',
    latitude: 52.5219,
    longitude: 13.4132,
  },
  {
    id: 'aldi-1',
    name: 'Aldi Nord Berlin',
    chain: 'aldi',
    address: 'Friedrichstraße 100, 10117 Berlin, Germany',
    latitude: 52.5119,
    longitude: 13.3907,
  },
  {
    id: 'rewe-1',
    name: 'REWE City Berlin',
    chain: 'rewe',
    address: 'Potsdamer Platz 1, 10785 Berlin, Germany',
    latitude: 52.5096,
    longitude: 13.3760,
  },
  {
    id: 'carrefour-1',
    name: 'Carrefour Paris 1er',
    chain: 'carrefour',
    address: '1 Rue de Rivoli, 75001 Paris, France',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: 'tesco-1',
    name: 'Tesco Express London',
    chain: 'tesco',
    address: '100 Oxford Street, London W1D 1LL, UK',
    latitude: 51.5154,
    longitude: -0.1410,
  },
];

// Mock discount items
const MOCK_DISCOUNT_ITEMS: DiscountItem[] = [
  // Vegetables
  {
    id: 'disc-1',
    name: 'Fresh Broccoli',
    category: 'vegetables',
    originalPrice: 2.49,
    discountPrice: 1.49,
    discountPercentage: 40,
    validFrom: '2026-02-22',
    validTo: '2026-02-28',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '500g',
  },
  {
    id: 'disc-2',
    name: 'Organic Carrots',
    category: 'vegetables',
    originalPrice: 1.99,
    discountPrice: 0.99,
    discountPercentage: 50,
    validFrom: '2026-02-22',
    validTo: '2026-03-01',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '1kg',
  },
  {
    id: 'disc-3',
    name: 'Bell Peppers Mix',
    category: 'vegetables',
    originalPrice: 3.49,
    discountPrice: 2.29,
    discountPercentage: 34,
    validFrom: '2026-02-22',
    validTo: '2026-02-27',
    supermarketId: 'aldi-1',
    supermarketName: 'Aldi Nord Berlin',
    unit: '3pcs',
  },
  // Fruits
  {
    id: 'disc-4',
    name: 'Bananas',
    category: 'fruits',
    originalPrice: 1.79,
    discountPrice: 0.99,
    discountPercentage: 45,
    validFrom: '2026-02-22',
    validTo: '2026-02-25',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '1kg',
  },
  {
    id: 'disc-5',
    name: 'Apples Gala',
    category: 'fruits',
    originalPrice: 2.99,
    discountPrice: 1.99,
    discountPercentage: 33,
    validFrom: '2026-02-22',
    validTo: '2026-03-05',
    supermarketId: 'rewe-1',
    supermarketName: 'REWE City Berlin',
    unit: '1.5kg',
  },
  // Meat
  {
    id: 'disc-6',
    name: 'Chicken Breast',
    category: 'meat',
    originalPrice: 8.99,
    discountPrice: 5.99,
    discountPercentage: 33,
    validFrom: '2026-02-22',
    validTo: '2026-02-24',
    supermarketId: 'rewe-1',
    supermarketName: 'REWE City Berlin',
    unit: '500g',
  },
  {
    id: 'disc-7',
    name: 'Ground Beef',
    category: 'meat',
    originalPrice: 6.49,
    discountPrice: 4.49,
    discountPercentage: 31,
    validFrom: '2026-02-22',
    validTo: '2026-02-26',
    supermarketId: 'aldi-1',
    supermarketName: 'Aldi Nord Berlin',
    unit: '400g',
  },
  // Fish
  {
    id: 'disc-8',
    name: 'Salmon Fillet',
    category: 'fish',
    originalPrice: 12.99,
    discountPrice: 8.99,
    discountPercentage: 31,
    validFrom: '2026-02-22',
    validTo: '2026-02-25',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '300g',
  },
  // Dairy & Eggs
  {
    id: 'disc-9',
    name: 'Free Range Eggs',
    category: 'dairy_eggs',
    originalPrice: 3.49,
    discountPrice: 2.49,
    discountPercentage: 29,
    validFrom: '2026-02-22',
    validTo: '2026-03-10',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '10pcs',
  },
  {
    id: 'disc-10',
    name: 'Greek Yogurt',
    category: 'dairy_eggs',
    originalPrice: 2.29,
    discountPrice: 1.49,
    discountPercentage: 35,
    validFrom: '2026-02-22',
    validTo: '2026-02-28',
    supermarketId: 'rewe-1',
    supermarketName: 'REWE City Berlin',
    unit: '500g',
  },
  // Grains
  {
    id: 'disc-11',
    name: 'Basmati Rice',
    category: 'grains',
    originalPrice: 3.99,
    discountPrice: 2.79,
    discountPercentage: 30,
    validFrom: '2026-02-22',
    validTo: '2026-03-15',
    supermarketId: 'aldi-1',
    supermarketName: 'Aldi Nord Berlin',
    unit: '1kg',
  },
  {
    id: 'disc-12',
    name: 'Whole Wheat Pasta',
    category: 'grains',
    originalPrice: 1.99,
    discountPrice: 1.29,
    discountPercentage: 35,
    validFrom: '2026-02-22',
    validTo: '2026-03-01',
    supermarketId: 'lidl-1',
    supermarketName: 'Lidl Berlin Mitte',
    unit: '500g',
  },
];

export class SupermarketService {
  private supermarkets: Supermarket[] = MOCK_SUPERMARKETS;
  private discountItems: DiscountItem[] = MOCK_DISCOUNT_ITEMS;

  // Calculate distance between two coordinates in km
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
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

  async getNearbySupermarkets(
    latitude: number, 
    longitude: number, 
    radius: number = 10
  ): Promise<Supermarket[]> {
    // In a real app, this would fetch from an API
    // For demo, we calculate distances from mock data
    return this.supermarkets
      .map(s => ({
        ...s,
        distance: this.calculateDistance(latitude, longitude, s.latitude, s.longitude)
      }))
      .filter(s => s.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!);
  }

  async getDiscountItems(
    _latitude?: number,
    _longitude?: number,
    _radius?: number,
    category?: FoodCategory
  ): Promise<DiscountItem[]> {
    let items = this.discountItems;

    // Filter by category if specified
    if (category) {
      items = items.filter(item => item.category === category);
    }

    // Sort by discount percentage (best deals first)
    items = items.sort((a, b) => b.discountPercentage - a.discountPercentage);

    return items;
  }

  async getDiscountItemsBySupermarket(supermarketId: string): Promise<DiscountItem[]> {
    return this.discountItems.filter(item => item.supermarketId === supermarketId);
  }

  getCategories(): { id: FoodCategory; name: string; icon: string }[] {
    return [
      { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
      { id: 'fruits', name: 'Fruits', icon: '🍎' },
      { id: 'meat', name: 'Meat', icon: '🥩' },
      { id: 'fish', name: 'Fish', icon: '🐟' },
      { id: 'dairy_eggs', name: 'Dairy & Eggs', icon: '🥚' },
      { id: 'grains', name: 'Grains', icon: '🌾' },
      { id: 'snacks', name: 'Snacks', icon: '🍿' },
      { id: 'beverages', name: 'Beverages', icon: '🥤' },
    ];
  }

  getBestDeals(limit: number = 5): DiscountItem[] {
    return this.discountItems
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, limit);
  }

  // Simulate fetching flyer from supermarket website
  async fetchSupermarketFlyer(supermarketId: string): Promise<string | null> {
    // In a real app, this would scrape the supermarket's website
    // or use their API to get the latest flyer
    const supermarket = this.supermarkets.find(s => s.id === supermarketId);
    if (!supermarket) return null;
    
    // Return mock flyer URL
    return `https://www.${supermarket.chain}.com/flyer`;
  }
}

// Singleton instance
let supermarketServiceInstance: SupermarketService | null = null;

export function getSupermarketService(): SupermarketService {
  if (!supermarketServiceInstance) {
    supermarketServiceInstance = new SupermarketService();
  }
  return supermarketServiceInstance;
}
