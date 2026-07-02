// User Preferences Types
export interface UserPreferences {
  peopleCount: number;
  cuisinePreference: CuisineType[];
  dietaryRestrictions: DietaryRestriction[];
  allergies: Allergy[];
  tastePreference: TasteType;
  cookingDifficulty: DifficultyLevel;
  healthConditions: HealthCondition[];
  customHealthNote?: string;
  addresses: Address[];
  favoriteRestaurants: string[];
  dislikedRecipes: string[];
  likedRecipes: string[];
  frequentlyUsedIngredients: string[];
  avoidedIngredients: string[];
}

export type CuisineType = 
  | 'chinese' 
  | 'western' 
  | 'asian' 
  | 'vegetarian' 
  | 'simple' 
  | 'fitness';

export type DietaryRestriction = 
  | 'halal' 
  | 'vegetarian' 
  | 'vegan' 
  | 'no_pork' 
  | 'kosher';

export type Allergy = 
  | 'peanut' 
  | 'seafood' 
  | 'lactose' 
  | 'gluten' 
  | 'egg' 
  | 'soy' 
  | 'tree_nuts';

export type TasteType = 
  | 'light' 
  | 'strong' 
  | 'sour_spicy' 
  | 'sweet' 
  | 'low_oil_salt';

export type DifficultyLevel = 
  | 'easy' 
  | 'medium' 
  | 'hard';

export type HealthCondition = 
  | 'stomach_issue' 
  | 'cold' 
  | 'recovery' 
  | 'weight_loss' 
  | 'muscle_gain' 
  | 'sugar_control' 
  | 'salt_control' 
  | 'none';

export interface Address {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

// Recipe Types
export interface Recipe {
  id: string;
  name: string;
  mealType: MealType;
  cuisineType: CuisineType;
  ingredients: Ingredient[];
  steps: string[];
  estimatedTime: number;
  difficulty: DifficultyLevel;
  nutrition: NutritionInfo;
  servings: number;
  imageUrl?: string;
  isDiscountBased?: boolean;
  healthTags?: HealthCondition[];
  estimatedCost?: number;     // approx EUR to cook the dish (for `servings`)
  estimatedSavings?: number;  // approx EUR saved vs normal prices
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface Ingredient {
  name: string;
  amount: string;
  isDiscounted?: boolean;
  originalPrice?: number;
  discountPrice?: number;
}

export interface NutritionInfo {
  protein: string;
  carbs: string;
  vegetables: string;
  calories?: number;
}

// Supermarket Types
export interface Supermarket {
  id: string;
  name: string;
  chain: SupermarketChain;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  flyerUrl?: string;
}

export type SupermarketChain = 
  | 'lidl' 
  | 'aldi' 
  | 'tesco' 
  | 'carrefour' 
  | 'rewe' 
  | 'auchan' 
  | 'intermarche' 
  | ' Mercadona'
  | 'esselunga'
  | 'coop';

export interface DiscountItem {
  id: string;
  name: string;
  category: FoodCategory;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  validFrom: string;
  validTo: string;
  supermarketId: string;
  supermarketName: string;
  imageUrl?: string;
  unit?: string;
}

export type FoodCategory = 
  | 'vegetables' 
  | 'fruits' 
  | 'meat' 
  | 'fish' 
  | 'dairy_eggs' 
  | 'grains' 
  | 'snacks' 
  | 'beverages';

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  cuisineType: CuisineType[];
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating: number;
  reviewCount: number;
  priceRange: number; // 1-4; 0 = unknown (e.g. OpenStreetMap has no price level)
  isOpen: boolean;
  openingHours: OpeningHours;
  phone?: string;
  website?: string;
  deliveryAvailable: boolean;
  promotion?: string;
  featuredDishes?: string[];
}

export interface OpeningHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

// Daily Menu Types
export interface DailyMenu {
  date: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
  isGenerated: boolean;
  usedDiscountItems: DiscountItem[];
}

// LLM Types
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  timeout: number;
}

export type LLMProvider = 
  | 'openai' 
  | 'doubao' 
  | 'tongyi' 
  | 'anthropic' 
  | 'custom';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// App State
export interface AppState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  selectedAddress: Address | null;
  dailyMenu: DailyMenu | null;
  isLoading: boolean;
  error: string | null;
  currentLanguage: string;
}
