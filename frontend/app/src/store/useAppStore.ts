import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  UserPreferences, 
  DailyMenu, 
  Address, 
  LLMConfig,
  Recipe,
  Restaurant 
} from '@/types';

interface AppStore {
  // User Preferences
  userPreferences: UserPreferences;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  
  // Addresses
  addresses: Address[];
  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  
  // Daily Menu
  dailyMenu: DailyMenu | null;
  setDailyMenu: (menu: DailyMenu | null) => void;
  
  // Recipe History
  recipeHistory: Recipe[];
  addToHistory: (recipe: Recipe) => void;
  likeRecipe: (recipeId: string) => void;
  dislikeRecipe: (recipeId: string) => void;
  isRecipeLiked: (recipeId: string) => boolean;
  isRecipeDisliked: (recipeId: string) => boolean;
  
  // Restaurant History
  restaurantHistory: Restaurant[];
  addToRestaurantHistory: (restaurant: Restaurant) => void;
  
  // LLM Config
  llmConfig: LLMConfig;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  
  // Google Maps
  googleMapsApiKey: string;
  updateGoogleMapsApiKey: (key: string) => void;
  
  // App State
  isFirstLaunch: boolean;
  setFirstLaunchComplete: () => void;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
}

const defaultUserPreferences: UserPreferences = {
  peopleCount: 2,
  cuisinePreference: ['chinese', 'western'],
  dietaryRestrictions: [],
  allergies: [],
  tastePreference: 'light',
  cookingDifficulty: 'medium',
  healthConditions: ['none'],
  addresses: [],
  favoriteRestaurants: [],
  dislikedRecipes: [],
  likedRecipes: [],
  frequentlyUsedIngredients: [],
  avoidedIngredients: [],
};

const defaultLLMConfig: LLMConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4',
  timeout: 30000,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // User Preferences
      userPreferences: defaultUserPreferences,
      updateUserPreferences: (prefs) => 
        set((state) => ({ 
          userPreferences: { ...state.userPreferences, ...prefs } 
        })),
      
      // Addresses
      addresses: [],
      addAddress: (address) => 
        set((state) => ({ 
          addresses: [...state.addresses, address] 
        })),
      removeAddress: (id) => 
        set((state) => ({ 
          addresses: state.addresses.filter(a => a.id !== id) 
        })),
      setDefaultAddress: (id) => 
        set((state) => ({ 
          addresses: state.addresses.map(a => ({
            ...a,
            isDefault: a.id === id
          }))
        })),
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      
      // Daily Menu
      dailyMenu: null,
      setDailyMenu: (menu) => set({ dailyMenu: menu }),
      
      // Recipe History
      recipeHistory: [],
      addToHistory: (recipe) => 
        set((state) => ({ 
          recipeHistory: [recipe, ...state.recipeHistory].slice(0, 100) 
        })),
      likeRecipe: (recipeId) => 
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            likedRecipes: [...state.userPreferences.likedRecipes, recipeId],
            dislikedRecipes: state.userPreferences.dislikedRecipes.filter(id => id !== recipeId)
          }
        })),
      dislikeRecipe: (recipeId) => 
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            dislikedRecipes: [...state.userPreferences.dislikedRecipes, recipeId],
            likedRecipes: state.userPreferences.likedRecipes.filter(id => id !== recipeId)
          }
        })),
      isRecipeLiked: (recipeId) => get().userPreferences.likedRecipes.includes(recipeId),
      isRecipeDisliked: (recipeId) => get().userPreferences.dislikedRecipes.includes(recipeId),
      
      // Restaurant History
      restaurantHistory: [],
      addToRestaurantHistory: (restaurant) => 
        set((state) => ({ 
          restaurantHistory: [restaurant, ...state.restaurantHistory].slice(0, 50) 
        })),
      
      // LLM Config
      llmConfig: defaultLLMConfig,
      updateLLMConfig: (config) => 
        set((state) => ({ 
          llmConfig: { ...state.llmConfig, ...config } 
        })),
      
      // Google Maps
      googleMapsApiKey: '',
      updateGoogleMapsApiKey: (key) => set({ googleMapsApiKey: key }),
      
      // App State
      isFirstLaunch: true,
      setFirstLaunchComplete: () => set({ isFirstLaunch: false }),
      currentLanguage: 'en',
      setLanguage: (lang) => set({ currentLanguage: lang }),
    }),
    {
      name: 'ai-meal-planner-storage',
      partialize: (state) => ({
        userPreferences: state.userPreferences,
        addresses: state.addresses,
        recipeHistory: state.recipeHistory,
        restaurantHistory: state.restaurantHistory,
        llmConfig: state.llmConfig,
        googleMapsApiKey: state.googleMapsApiKey,
        isFirstLaunch: state.isFirstLaunch,
        currentLanguage: state.currentLanguage,
      }),
    }
  )
);
