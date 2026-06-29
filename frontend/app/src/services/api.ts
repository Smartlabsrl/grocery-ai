import type { DiscountItem, FoodCategory } from '@/types';

// Base URL of the Flask backend. Override with VITE_API_BASE_URL at build time.
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://grocery-ai-backend-kli0.onrender.com';

export interface BackendStore {
  id: string;
  name: string;
  distance?: number; // km to nearest branch (when location is known)
  branch?: string;   // nearest branch name
  address?: string;
}

export interface NearbyResult {
  country: string | null;
  region: string | null; // administrative region (e.g. "Lombardy")
  stores: BackendStore[];
}

export interface BackendDealItem {
  name: string;
  discountPrice: number;
  normalPrice: number;
  unit?: string;
  discountPercent?: number;
}

export interface SupermarketDealsResponse {
  breakfast: unknown | null;
  lunch: unknown | null;
  dinner: unknown | null;
  usedDiscountItems: BackendDealItem[];
}

/** Supported supermarkets near the user. With coordinates, results are gated to
 *  the user's country and include the nearest branch + distance. */
export async function getNearbySupermarkets(
  latitude?: number,
  longitude?: number
): Promise<NearbyResult> {
  const q =
    latitude != null && longitude != null
      ? `?lat=${latitude}&lon=${longitude}`
      : '';
  const res = await fetch(`${API_BASE}/nearby-supermarkets${q}`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

/** Parsed deals + AI menu for a single store. */
export async function getSupermarketDeals(
  store: string,
  refresh = false
): Promise<SupermarketDealsResponse> {
  const url = `${API_BASE}/supermarket-deals?store=${encodeURIComponent(store)}${
    refresh ? '&refresh=true' : ''
  }`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

// Keyword-based category inference (backend does not classify products).
const CATEGORY_KEYWORDS: Record<FoodCategory, string[]> = {
  fish: ['salmon', 'losos', 'tuna', 'cod', 'fish', 'hobotnica', 'file', 'riba', 'oslič'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'svinj', 'pišč', 'goved', 'meat', 'salam', 'šunk', 'klobas', 'meso'],
  dairy_eggs: ['milk', 'cheese', 'yogurt', 'butter', 'egg', 'mleko', 'sir', 'jogurt', 'maslo', 'jajc', 'skuta'],
  fruits: ['apple', 'banana', 'orange', 'fruit', 'berry', 'jabolk', 'banan', 'pomaranč', 'sadje', 'grozdje', 'jagod'],
  vegetables: ['salad', 'tomato', 'pepper', 'potato', 'onion', 'solat', 'paradiž', 'paprik', 'zelen', 'krompir', 'čebul', 'korenj'],
  grains: ['rice', 'pasta', 'bread', 'flour', 'cereal', 'oat', 'riž', 'kruh', 'testenine', 'moka', 'žita'],
  beverages: ['water', 'juice', 'coffee', 'tea', 'voda', 'sok', 'kava', 'čaj', 'pijač'],
  snacks: ['chip', 'chocolate', 'cookie', 'snack', 'candy', 'čokolad', 'piškot', 'prigrizek', 'bonbon'],
};

function inferCategory(name: string): FoodCategory {
  const lower = name.toLowerCase();
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as FoodCategory;
  }
  return 'grains';
}

/** Map raw backend deal items into the frontend DiscountItem shape. */
export function mapDealsToDiscountItems(
  storeId: string,
  storeName: string,
  items: BackendDealItem[]
): DiscountItem[] {
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setDate(validTo.getDate() + 7);

  return items
    .filter((it) => it && it.discountPrice > 0 && it.normalPrice > 0)
    .map((it, i) => {
      const percent =
        it.discountPercent ??
        Math.round(((it.normalPrice - it.discountPrice) / it.normalPrice) * 100);
      return {
        id: `${storeId}-${i}`,
        name: it.name,
        category: inferCategory(it.name),
        originalPrice: it.normalPrice,
        discountPrice: it.discountPrice,
        discountPercentage: Math.round(percent),
        validFrom: validFrom.toISOString().split('T')[0],
        validTo: validTo.toISOString().split('T')[0],
        supermarketId: storeId,
        supermarketName: storeName,
        unit: it.unit,
      };
    });
}
