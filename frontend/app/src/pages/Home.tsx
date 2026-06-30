import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChefHat, 
  MapPin, 
  ShoppingCart, 
  Utensils, 
  Settings,
  RefreshCw,
  Heart,
  Clock,
  Flame,
  Users,
  ArrowRight,
  Sparkles,
  Store,
  Navigation,
  AlertCircle,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import { useLocation } from '@/hooks/useLocation';
import { getSupermarketDeals, getNearbySupermarkets } from '@/services/api';
import type { Recipe, DailyMenu } from '@/types';

export function Home() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('breakfast');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNoCookMode, setShowNoCookMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    dailyMenu, 
    setDailyMenu, 
    selectedAddress,
    likeRecipe, 
    isRecipeLiked,
    llmConfig
  } = useAppStore();
  
  useLocation();

  const generateDailyMenu = async (force = false) => {
    setError(null);
    setIsGenerating(true);
  
    try {
      // Pick the supermarket nearest to the user (location-aware), not a fixed store.
      const { stores } = await getNearbySupermarkets(
        selectedAddress?.latitude,
        selectedAddress?.longitude
      );
      if (!stores.length) {
        setError(t('home.noStoreNearby') || 'No supported supermarket near you yet.');
        return;
      }

      const data = await getSupermarketDeals(
        stores[0].id,
        force,
        selectedAddress?.latitude,
        selectedAddress?.longitude
      );
      setDailyMenu(data as unknown as DailyMenu);

    } catch (err) {
      console.error("Failed to load weekly savings plan:", err);
      setError("Failed to load real supermarket deals.");
    } finally {
      setIsGenerating(false);
    }
  };
  // Generate menu on first load if not exists and API is configured
  useEffect(() => {
    if (!dailyMenu && !isGenerating) {
      generateDailyMenu();
    }
  }, []);

  const handleLikeRecipe = (recipe: Recipe) => {
    if (isRecipeLiked(recipe.id)) {
      // Unlike - not implemented yet
    } else {
      likeRecipe(recipe.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('app.name')}</h1>
                <p className="text-xs text-gray-500">{t('app.tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedAddress && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <MapPin className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{selectedAddress.name}</span>
                </div>
              )}
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => window.location.href = '/settings'}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowNoCookMode(true)}
          >
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Utensils className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">{t('home.noCooking')}</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = '/supermarket'}
          >
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">{t('home.deals')}</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = '/restaurants'}
          >
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Navigation className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">{t('home.restaurants')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Menu */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('home.title')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateDailyMenu(true)}
              disabled={isGenerating}
              className="gap-1"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="text-xs">{t('home.regenerate')}</span>
            </Button>
          </div>

          {isGenerating ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : dailyMenu?.breakfast && dailyMenu?.lunch && dailyMenu?.dinner ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="breakfast">{t('home.breakfast')}</TabsTrigger>
                <TabsTrigger value="lunch">{t('home.lunch')}</TabsTrigger>
                <TabsTrigger value="dinner">{t('home.dinner')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="breakfast">
                <RecipeCard 
                  recipe={dailyMenu.breakfast}
                  onLike={() => handleLikeRecipe(dailyMenu.breakfast)}
                  isLiked={dailyMenu.breakfast?.id ? isRecipeLiked(dailyMenu.breakfast.id) : false}
                />
              </TabsContent>
              
              <TabsContent value="lunch">
                <RecipeCard 
                  recipe={dailyMenu.lunch}
                  onLike={() => handleLikeRecipe(dailyMenu.lunch)}
                  isLiked={dailyMenu.lunch?.id ? isRecipeLiked(dailyMenu.lunch.id) : false}
                />
              </TabsContent>
              
              <TabsContent value="dinner">
                <RecipeCard 
                  recipe={dailyMenu.dinner}
                  onLike={() => handleLikeRecipe(dailyMenu.dinner)}
                  isLiked={dailyMenu.dinner?.id ? isRecipeLiked(dailyMenu.dinner.id) : false}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">{t('home.noMenu')}</p>
              <Button onClick={() => generateDailyMenu()} disabled={isGenerating}>
                {isGenerating ? t('common.loading') : t('home.generateMenu')}
              </Button>
              {!llmConfig.apiKey && (
                <p className="text-xs text-orange-500 mt-2">
                  {t('home.configureAPI')}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Discount Ingredients Used */}
        {dailyMenu && dailyMenu.usedDiscountItems.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-600" />
                {t('home.discountIngredients')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {dailyMenu.usedDiscountItems.map((item, idx) => {
                  // Backend sends `discountPercent`/`normalPrice`; tolerate both shapes.
                  const it = item as {
                    discountPercentage?: number;
                    discountPercent?: number;
                    normalPrice?: number;
                    discountPrice?: number;
                  };
                  const pct =
                    it.discountPercentage ??
                    it.discountPercent ??
                    (it.normalPrice && it.discountPrice
                      ? Math.round((1 - it.discountPrice / it.normalPrice) * 100)
                      : null);
                  return (
                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700">
                      {item.name}
                      {pct != null && (
                        <span className="ml-1 text-green-500">-{Math.round(pct)}%</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* No Cook Mode Modal */}
      {showNoCookMode && (
        <NoCookMode onClose={() => setShowNoCookMode(false)} />
      )}
    </div>
  );
}

// Cost & savings strip — the core "save money" payoff for a dish
function CostSavings({ recipe }: { recipe: Recipe }) {
  const { t } = useTranslation();
  const cost = recipe.estimatedCost;
  const savings = recipe.estimatedSavings;
  if (cost == null && savings == null) return null;

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      {cost != null && (
        <Badge variant="secondary" className="text-sm bg-gray-100 text-gray-800">
          <Wallet className="w-3.5 h-3.5 mr-1" />
          ~€{cost.toFixed(2)} · {recipe.servings} {t('home.servings')}
        </Badge>
      )}
      {savings != null && savings > 0 && (
        <Badge className="text-sm bg-green-500 text-white">
          <PiggyBank className="w-3.5 h-3.5 mr-1" />
          {t('home.save')} €{savings.toFixed(2)}
        </Badge>
      )}
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  onLike: () => void;
  isLiked: boolean;
}

function RecipeCard({ recipe, onLike, isLiked }: RecipeCardProps) {
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);

  if (showDetail) {
    return (
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
          <ChefHat className="w-16 h-16 text-white/50" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{recipe.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {t(`cuisines.${recipe.cuisineType}`)}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.estimatedTime} {t('home.estimatedTime')}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 ${isLiked ? 'text-red-500' : ''}`}
                onClick={onLike}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('home.ingredients')}</h4>
            <div className="flex flex-wrap gap-1">
            {recipe.ingredients?.map((ing, idx) => (
                <Badge 
                  key={idx} 
                  variant={ing.isDiscounted ? "default" : "secondary"}
                  className={ing.isDiscounted ? "bg-green-500" : ""}
                >
                  {ing.name} {ing.amount}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cost & savings */}
          <CostSavings recipe={recipe} />

          {/* Steps */}
          <div className="mb-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('home.steps')}</h4>
            <ol className="space-y-2">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500">{t('home.protein')}</p>
              <p className="font-semibold text-sm">{recipe.nutrition.protein}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t('home.carbs')}</p>
              <p className="font-semibold text-sm">{recipe.nutrition.carbs}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t('home.vegetables')}</p>
              <p className="font-semibold text-sm">{recipe.nutrition.vegetables}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t('home.servings')}</p>
              <p className="font-semibold text-sm flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.servings}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setShowDetail(false)}
          >
            {t('home.showLess')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="h-32 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
        <ChefHat className="w-12 h-12 text-white/50" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.estimatedTime} min
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {t(`settings.difficultyOptions.${recipe.difficulty}`)}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.servings}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`w-8 h-8 ${isLiked ? 'text-red-500' : ''}`}
              onClick={(e) => { e.stopPropagation(); onLike(); }}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <CostSavings recipe={recipe} />

        <Button
          variant="ghost"
          className="w-full mt-3 text-green-600"
          onClick={() => setShowDetail(true)}
        >
          {t('home.viewRecipe')} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

// No Cook Mode Component
interface NoCookModeProps {
  onClose: () => void;
}

function NoCookMode({ onClose }: NoCookModeProps) {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAddress, userPreferences } = useAppStore();

  useEffect(() => {
    const loadRestaurants = async () => {
      const { getRestaurantService } = await import('@/services/restaurant');
      const service = getRestaurantService();
      
      if (selectedAddress) {
        const results = await service.getNearbyRestaurants(
          selectedAddress.latitude,
          selectedAddress.longitude,
          { 
            openNow: true, 
            minRating: 4,
            cuisineType: userPreferences.cuisinePreference
          }
        );
        setRestaurants(results);
      }
      setIsLoading(false);
    };
    
    loadRestaurants();
  }, [selectedAddress, userPreferences.cuisinePreference]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('noCook.title')}</h2>
            <p className="text-sm text-gray-500">{t('noCook.subtitle')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500">{restaurant.cuisineType.join(', ')}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          ★ {restaurant.rating}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {restaurant.distance?.toFixed(1)} km
                        </span>
                        <span className="text-xs text-gray-500">
                          {'€'.repeat(restaurant.priceRange)}
                        </span>
                      </div>
                      {restaurant.promotion && (
                        <Badge className="mt-2 bg-orange-100 text-orange-700 text-xs">
                          {restaurant.promotion}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('noCook.noRestaurants')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
