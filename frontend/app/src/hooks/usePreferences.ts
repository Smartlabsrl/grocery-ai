import { useAppStore } from '@/store/useAppStore';
import type { 
  UserPreferences, 
  Address, 
  CuisineType, 
  DietaryRestriction,
  Allergy,
  TasteType,
  DifficultyLevel,
  HealthCondition
} from '@/types';

interface UsePreferencesReturn {
  // Getters
  preferences: UserPreferences;
  addresses: Address[];
  selectedAddress: Address | null;
  
  // Setters
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setPeopleCount: (count: number) => void;
  setCuisinePreference: (cuisines: CuisineType[]) => void;
  addDietaryRestriction: (restriction: DietaryRestriction) => void;
  removeDietaryRestriction: (restriction: DietaryRestriction) => void;
  addAllergy: (allergy: Allergy) => void;
  removeAllergy: (allergy: Allergy) => void;
  setTastePreference: (taste: TasteType) => void;
  setCookingDifficulty: (difficulty: DifficultyLevel) => void;
  setHealthConditions: (conditions: HealthCondition[]) => void;
  setCustomHealthNote: (note: string) => void;
  
  // Address management
  addAddress: (address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  setSelectedAddress: (address: Address | null) => void;
  
  // Recipe preferences
  likeRecipe: (recipeId: string) => void;
  dislikeRecipe: (recipeId: string) => void;
  isRecipeLiked: (recipeId: string) => boolean;
  isRecipeDisliked: (recipeId: string) => boolean;
  
  // Ingredient preferences
  addFrequentIngredient: (ingredient: string) => void;
  removeFrequentIngredient: (ingredient: string) => void;
  addAvoidedIngredient: (ingredient: string) => void;
  removeAvoidedIngredient: (ingredient: string) => void;
}

export function usePreferences(): UsePreferencesReturn {
  const store = useAppStore();

  const addAddress = (address: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...address,
      id: `addr-${Date.now()}`,
    };
    store.addAddress(newAddress);
  };

  const addDietaryRestriction = (restriction: DietaryRestriction) => {
    const current = store.userPreferences.dietaryRestrictions;
    if (!current.includes(restriction)) {
      store.updateUserPreferences({
        dietaryRestrictions: [...current, restriction]
      });
    }
  };

  const removeDietaryRestriction = (restriction: DietaryRestriction) => {
    store.updateUserPreferences({
      dietaryRestrictions: store.userPreferences.dietaryRestrictions.filter(
        r => r !== restriction
      )
    });
  };

  const addAllergy = (allergy: Allergy) => {
    const current = store.userPreferences.allergies;
    if (!current.includes(allergy)) {
      store.updateUserPreferences({
        allergies: [...current, allergy]
      });
    }
  };

  const removeAllergy = (allergy: Allergy) => {
    store.updateUserPreferences({
      allergies: store.userPreferences.allergies.filter(a => a !== allergy)
    });
  };

  const addFrequentIngredient = (ingredient: string) => {
    const current = store.userPreferences.frequentlyUsedIngredients;
    if (!current.includes(ingredient)) {
      store.updateUserPreferences({
        frequentlyUsedIngredients: [...current, ingredient]
      });
    }
  };

  const removeFrequentIngredient = (ingredient: string) => {
    store.updateUserPreferences({
      frequentlyUsedIngredients: store.userPreferences.frequentlyUsedIngredients.filter(
        i => i !== ingredient
      )
    });
  };

  const addAvoidedIngredient = (ingredient: string) => {
    const current = store.userPreferences.avoidedIngredients;
    if (!current.includes(ingredient)) {
      store.updateUserPreferences({
        avoidedIngredients: [...current, ingredient]
      });
    }
  };

  const removeAvoidedIngredient = (ingredient: string) => {
    store.updateUserPreferences({
      avoidedIngredients: store.userPreferences.avoidedIngredients.filter(
        i => i !== ingredient
      )
    });
  };

  return {
    // Getters
    preferences: store.userPreferences,
    addresses: store.addresses,
    selectedAddress: store.selectedAddress,
    
    // Setters
    updatePreferences: store.updateUserPreferences,
    setPeopleCount: (count) => store.updateUserPreferences({ peopleCount: count }),
    setCuisinePreference: (cuisines) => store.updateUserPreferences({ cuisinePreference: cuisines }),
    addDietaryRestriction,
    removeDietaryRestriction,
    addAllergy,
    removeAllergy,
    setTastePreference: (taste) => store.updateUserPreferences({ tastePreference: taste }),
    setCookingDifficulty: (difficulty) => store.updateUserPreferences({ cookingDifficulty: difficulty }),
    setHealthConditions: (conditions) => store.updateUserPreferences({ healthConditions: conditions }),
    setCustomHealthNote: (note) => store.updateUserPreferences({ customHealthNote: note }),
    
    // Address management
    addAddress,
    removeAddress: store.removeAddress,
    setDefaultAddress: store.setDefaultAddress,
    setSelectedAddress: store.setSelectedAddress,
    
    // Recipe preferences
    likeRecipe: store.likeRecipe,
    dislikeRecipe: store.dislikeRecipe,
    isRecipeLiked: store.isRecipeLiked,
    isRecipeDisliked: store.isRecipeDisliked,
    
    // Ingredient preferences
    addFrequentIngredient,
    removeFrequentIngredient,
    addAvoidedIngredient,
    removeAvoidedIngredient,
  };
}
