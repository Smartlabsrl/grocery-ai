import type { Restaurant, CuisineType, OpeningHours } from '@/types';

// Restaurant data sourced from OpenStreetMap via the Overpass API (free, no API key).
// Note: OSM has no ratings/reviews/price level, so those fields are left empty/unknown
// and the UI degrades gracefully.

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

const DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_NAMES: Record<string, string> = {
  Mo: 'monday',
  Tu: 'tuesday',
  We: 'wednesday',
  Th: 'thursday',
  Fr: 'friday',
  Sa: 'saturday',
  Su: 'sunday',
};

// Map free-form OSM `cuisine` values onto the app's CuisineType set.
const CUISINE_MAP: Record<string, CuisineType> = {
  chinese: 'chinese',
  cantonese: 'chinese',
  sichuan: 'chinese',
  dim_sum: 'chinese',
  asian: 'asian',
  japanese: 'asian',
  sushi: 'asian',
  ramen: 'asian',
  korean: 'asian',
  thai: 'asian',
  vietnamese: 'asian',
  indian: 'asian',
  indonesian: 'asian',
  italian: 'western',
  pizza: 'western',
  french: 'western',
  american: 'western',
  burger: 'western',
  german: 'western',
  mexican: 'western',
  spanish: 'western',
  greek: 'western',
  mediterranean: 'western',
  european: 'western',
  steak_house: 'western',
  steak: 'western',
  regional: 'western',
  international: 'western',
  vegetarian: 'vegetarian',
  vegan: 'vegetarian',
  salad: 'fitness',
  healthy: 'fitness',
  organic: 'fitness',
  poke: 'fitness',
  breakfast: 'simple',
  sandwich: 'simple',
  cafe: 'simple',
  coffee_shop: 'simple',
  bakery: 'simple',
  kebab: 'simple',
  fast_food: 'simple',
};

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function mapCuisine(raw?: string): CuisineType[] {
  if (!raw) return ['simple'];
  const tokens = raw.toLowerCase().split(/[;,]/).map((t) => t.trim());
  const mapped = new Set<CuisineType>();
  for (const token of tokens) {
    const match = CUISINE_MAP[token];
    if (match) mapped.add(match);
  }
  return mapped.size > 0 ? Array.from(mapped) : ['simple'];
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' '),
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.join(', ');
}

// Best-effort parse of an OSM opening_hours string into a per-day {open, close} map.
// Returns {} when the value is missing or too complex to parse (treated as unknown).
function parseOpeningHours(value?: string): OpeningHours {
  const result: OpeningHours = {};
  if (!value) return result;

  if (value.includes('24/7')) {
    for (const abbr of DAY_ORDER) result[DAY_NAMES[abbr]] = { open: '00:00', close: '23:59' };
    return result;
  }

  for (const rule of value.split(';')) {
    const match = rule
      .trim()
      .match(/^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (!match) continue;

    const [, startDay, endDay, open, close] = match;
    const startIdx = DAY_ORDER.indexOf(startDay);
    if (startIdx === -1) continue;
    const endIdx = endDay ? DAY_ORDER.indexOf(endDay) : startIdx;
    if (endIdx === -1) continue;

    for (let i = startIdx; i <= endIdx; i++) {
      const dayName = DAY_NAMES[DAY_ORDER[i]];
      if (dayName && !result[dayName]) result[dayName] = { open, close };
    }
  }

  return result;
}

function isCurrentlyOpen(openingHours: OpeningHours): boolean {
  // Unknown hours -> assume open so it is not hidden by the "open now" filter.
  if (Object.keys(openingHours).length === 0) return true;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const hours = openingHours[dayNames[now.getDay()]];
  if (!hours) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Overnight hours (e.g. 17:00-01:00): open if before close OR after open.
  if (closeTime < openTime) return currentTime >= openTime || currentTime <= closeTime;
  return currentTime >= openTime && currentTime <= closeTime;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function elementToRestaurant(
  el: OverpassElement,
  originLat: number,
  originLon: number
): Restaurant | null {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat === undefined || lon === undefined || !tags.name) return null;

  const openingHours = parseOpeningHours(tags.opening_hours);

  return {
    id: `osm-${el.type}-${el.id}`,
    name: tags.name,
    cuisineType: mapCuisine(tags.cuisine),
    address: buildAddress(tags),
    latitude: lat,
    longitude: lon,
    distance: calculateDistance(originLat, originLon, lat, lon),
    rating: 0, // OSM has no ratings
    reviewCount: 0,
    priceRange: 0, // unknown
    isOpen: isCurrentlyOpen(openingHours),
    openingHours,
    phone: tags.phone || tags['contact:phone'],
    website: tags.website || tags['contact:website'],
    deliveryAvailable: tags.delivery === 'yes' || tags.takeaway === 'yes',
  };
}

export class RestaurantService {
  private cache = new Map<string, { items: Restaurant[]; timestamp: number }>();
  private cacheDuration = 1000 * 60 * 30; // 30 minutes (be gentle with the free Overpass API)

  private async fetchFromOverpass(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<Restaurant[]> {
    const radiusM = Math.round(radiusKm * 1000);
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)},${radiusM}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.items;
    }

    const query = `[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radiusM},${latitude},${longitude});
  way["amenity"="restaurant"](around:${radiusM},${latitude},${longitude});
);
out center tags 60;`;

    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) throw new Error(`Overpass error: ${response.status}`);

      const data = await response.json();
      const items: Restaurant[] = (data.elements as OverpassElement[])
        .map((el) => elementToRestaurant(el, latitude, longitude))
        .filter((r): r is Restaurant => r !== null)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

      this.cache.set(cacheKey, { items, timestamp: Date.now() });
      return items;
    } catch (error) {
      console.error('Overpass restaurant fetch failed:', error);
      return [];
    }
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
      minRating?: number; // ignored: OSM has no ratings
    } = {}
  ): Promise<Restaurant[]> {
    const { radius = 10, cuisineType, priceRange, openNow = false, deliveryOnly = false } = options;

    let results = await this.fetchFromOverpass(latitude, longitude, radius);

    if (cuisineType && cuisineType.length > 0) {
      results = results.filter((r) => r.cuisineType.some((c) => cuisineType.includes(c)));
    }

    if (priceRange && priceRange.length > 0) {
      // Keep unknown-price (0) restaurants so the free data source isn't filtered away.
      results = results.filter((r) => r.priceRange === 0 || priceRange.includes(r.priceRange));
    }

    if (openNow) {
      results = results.filter((r) => r.isOpen);
    }

    if (deliveryOnly) {
      results = results.filter((r) => r.deliveryAvailable);
    }

    return results;
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    for (const { items } of this.cache.values()) {
      const found = items.find((r) => r.id === id);
      if (found) return found;
    }
    return null;
  }

  async searchRestaurants(
    latitude: number,
    longitude: number,
    query: string
  ): Promise<Restaurant[]> {
    const all = await this.fetchFromOverpass(latitude, longitude, 10);
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (r) =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.cuisineType.some((c) => c.toLowerCase().includes(lowerQuery))
    );
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
