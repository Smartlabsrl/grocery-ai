import type { DiscountItem, FoodCategory, Supermarket } from '@/types';

// European Supermarket Chains and their flyer URLs
const SUPERMARKET_CHAINS = {
  lidl: {
    name: 'Lidl',
    countries: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PL', 'DK', 'SE', 'FI', 'CZ'],
    flyerUrl: (country: string) => `https://www.lidl.${country.toLowerCase()}/flyer`,
    apiEndpoint: 'https://www.lidl.de/c/api/leaflets',
  },
  aldi: {
    name: 'Aldi',
    countries: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PL', 'DK', 'SE', 'GB'],
    flyerUrl: (country: string) => `https://www.aldi.${country.toLowerCase()}/flyer`,
  },
  tesco: {
    name: 'Tesco',
    countries: ['GB', 'IE', 'CZ', 'HU', 'PL', 'SK'],
    flyerUrl: (country: string) => `https://www.tesco.${country.toLowerCase()}/groceries/en-GB/promotions`,
  },
  carrefour: {
    name: 'Carrefour',
    countries: ['FR', 'ES', 'IT', 'BE', 'PL', 'RO'],
    flyerUrl: (country: string) => `https://www.carrefour.${country.toLowerCase()}/promotions`,
  },
  rewe: {
    name: 'REWE',
    countries: ['DE'],
    flyerUrl: () => 'https://www.rewe.de/angebote',
  },
  auchan: {
    name: 'Auchan',
    countries: ['FR', 'ES', 'IT', 'PL', 'PT', 'RO', 'HU'],
    flyerUrl: (country: string) => `https://www.auchan.${country.toLowerCase()}/promotions`,
  },
  intermarche: {
    name: 'Intermarché',
    countries: ['FR', 'PT', 'PL', 'BE'],
    flyerUrl: (country: string) => `https://www.intermarche.${country.toLowerCase()}/promotions`,
  },
  mercadona: {
    name: 'Mercadona',
    countries: ['ES', 'PT'],
    flyerUrl: (country: string) => `https://www.mercadona.${country.toLowerCase()}/promotions`,
  },
  esselunga: {
    name: 'Esselunga',
    countries: ['IT'],
    flyerUrl: () => 'https://www.esselunga.it/volantini',
  },
  coop: {
    name: 'Coop',
    countries: ['IT', 'SE', 'DK', 'FI', 'NO'],
    flyerUrl: (country: string) => `https://www.coop.${country.toLowerCase()}/offers`,
  },
};

// Mock discount data generator based on real supermarket patterns
function generateMockDiscounts(supermarket: Supermarket): DiscountItem[] {
  const categories: FoodCategory[] = ['vegetables', 'fruits', 'meat', 'fish', 'dairy_eggs', 'grains'];
  const products: Record<FoodCategory, string[]> = {
    vegetables: ['Fresh Broccoli', 'Organic Carrots', 'Bell Peppers', 'Spinach', 'Tomatoes', 'Cucumber'],
    fruits: ['Bananas', 'Apples Gala', 'Oranges', 'Strawberries', 'Grapes', 'Watermelon'],
    meat: ['Chicken Breast', 'Ground Beef', 'Pork Chops', 'Turkey Breast', 'Beef Steak'],
    fish: ['Salmon Fillet', 'Cod Fillet', 'Tuna Steak', 'Shrimp', 'Mackerel'],
    dairy_eggs: ['Free Range Eggs', 'Greek Yogurt', 'Cheddar Cheese', 'Milk', 'Butter'],
    grains: ['Basmati Rice', 'Whole Wheat Pasta', 'Quinoa', 'Oats', 'Bread'],
    snacks: ['Potato Chips', 'Chocolate Bar', 'Cookies', 'Nuts Mix'],
    beverages: ['Orange Juice', 'Mineral Water', 'Coffee', 'Tea'],
  };

  const discounts: DiscountItem[] = [];
  const numItems = Math.floor(Math.random() * 8) + 5;

  for (let i = 0; i < numItems; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const product = products[category][Math.floor(Math.random() * products[category].length)];
    const discountPercentage = [20, 25, 30, 33, 40, 50][Math.floor(Math.random() * 6)];
    const originalPrice = parseFloat((Math.random() * 10 + 1).toFixed(2));
    const discountPrice = parseFloat((originalPrice * (1 - discountPercentage / 100)).toFixed(2));

    const validFrom = new Date();
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + Math.floor(Math.random() * 7) + 3);

    discounts.push({
      id: `${supermarket.id}-disc-${i}`,
      name: product,
      category,
      originalPrice,
      discountPrice,
      discountPercentage,
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0],
      supermarketId: supermarket.id,
      supermarketName: supermarket.name,
      unit: ['500g', '1kg', 'pack', 'bottle', 'pcs'][Math.floor(Math.random() * 5)],
    });
  }

  return discounts;
}

export class SupermarketScraperService {
  private discountCache: Map<string, { items: DiscountItem[]; timestamp: number }> = new Map();
  private cacheDuration = 1000 * 60 * 60; // 1 hour

  // Detect country from coordinates (simplified)
  private detectCountry(latitude: number, longitude: number): string {
    // This is a simplified version - in production, use reverse geocoding
    // Rough bounding boxes for major European countries
    if (latitude > 47 && latitude < 55 && longitude > 5 && longitude < 15) return 'DE';
    if (latitude > 41 && latitude < 51 && longitude > -5 && longitude < 8) return 'FR';
    if (latitude > 36 && latitude < 44 && longitude > -10 && longitude < 3) return 'ES';
    if (latitude > 37 && latitude < 47 && longitude > 6 && longitude < 19) return 'IT';
    if (latitude > 50 && latitude < 54 && longitude > -8 && longitude < 2) return 'GB';
    if (latitude > 52 && latitude < 54 && longitude > 4 && longitude < 7) return 'NL';
    if (latitude > 49 && latitude < 52 && longitude > 2 && longitude < 7) return 'BE';
    return 'DE'; // Default to Germany
  }

  // Get supermarkets for a location
  async getSupermarketsForLocation(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Supermarket[]> {
    const country = this.detectCountry(latitude, longitude);
    
    // Filter supermarkets by country
    const availableChains = Object.entries(SUPERMARKET_CHAINS)
      .filter(([_, chain]) => chain.countries.includes(country))
      .map(([key, chain]) => ({
        id: `${key}-1`,
        name: `${chain.name} ${country}`,
        chain: key as any,
        address: `Sample ${chain.name} location`,
        latitude: latitude + (Math.random() - 0.5) * 0.1,
        longitude: longitude + (Math.random() - 0.5) * 0.1,
        distance: Math.random() * radius,
      }));

    return availableChains;
  }

  // Scrape discounts from a supermarket
  async scrapeDiscounts(supermarket: Supermarket): Promise<DiscountItem[]> {
    const cacheKey = supermarket.id;
    const cached = this.discountCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.items;
    }

    // In a real implementation, this would:
    // 1. Fetch the supermarket's flyer page
    // 2. Parse the HTML to extract product information
    // 3. Use OCR or image recognition for PDF flyers
    // 4. Handle different formats (HTML, PDF, API)

    // For now, generate realistic mock data
    const discounts = generateMockDiscounts(supermarket);

    this.discountCache.set(cacheKey, {
      items: discounts,
      timestamp: Date.now(),
    });

    return discounts;
  }

  // Get all discounts for a location
  async getAllDiscountsForLocation(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<{ supermarket: Supermarket; discounts: DiscountItem[] }[]> {
    const supermarkets = await this.getSupermarketsForLocation(latitude, longitude, radius);
    
    const results = await Promise.all(
      supermarkets.map(async (supermarket) => ({
        supermarket,
        discounts: await this.scrapeDiscounts(supermarket),
      }))
    );

    return results;
  }

  // Get flyer URL for a supermarket
  getFlyerUrl(supermarket: Supermarket): string {
    const chain = SUPERMARKET_CHAINS[supermarket.chain as keyof typeof SUPERMARKET_CHAINS];
    if (!chain) return '';

    const country = this.detectCountry(supermarket.latitude, supermarket.longitude);
    return chain.flyerUrl(country.toLowerCase());
  }

  // Search for specific products
  async searchProducts(
    latitude: number,
    longitude: number,
    query: string
  ): Promise<{ item: DiscountItem; supermarket: Supermarket }[]> {
    const allDiscounts = await this.getAllDiscountsForLocation(latitude, longitude);
    const results: { item: DiscountItem; supermarket: Supermarket }[] = [];

    const lowerQuery = query.toLowerCase();

    for (const { supermarket, discounts } of allDiscounts) {
      for (const item of discounts) {
        if (item.name.toLowerCase().includes(lowerQuery)) {
          results.push({ item, supermarket });
        }
      }
    }

    return results.sort((a, b) => b.item.discountPercentage - a.item.discountPercentage);
  }

  // Clear cache
  clearCache() {
    this.discountCache.clear();
  }
}

// Singleton instance
let scraperServiceInstance: SupermarketScraperService | null = null;

export function getSupermarketScraperService(): SupermarketScraperService {
  if (!scraperServiceInstance) {
    scraperServiceInstance = new SupermarketScraperService();
  }
  return scraperServiceInstance;
}
