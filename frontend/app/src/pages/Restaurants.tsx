import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  Utensils, 
  MapPin, 
  Search,
  Star,
  Clock,
  Navigation,
  Phone,
  Globe,
  Bike,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/useAppStore';
import { getRestaurantService } from '@/services/restaurant';
import type { Restaurant, CuisineType } from '@/types';

const CUISINE_FILTERS: CuisineType[] = ['chinese', 'western', 'asian', 'vegetarian', 'simple', 'fitness'];
const PRICE_RANGES = [1, 2, 3, 4];

export function RestaurantsPage() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(true);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('nearby');
  
  const { selectedAddress, userPreferences } = useAppStore();
  const restaurantService = getRestaurantService();

  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoading(true);
      
      if (selectedAddress) {
        const results = await restaurantService.getNearbyRestaurants(
          selectedAddress.latitude,
          selectedAddress.longitude,
          {
            cuisineType: selectedCuisines.length > 0 ? selectedCuisines : userPreferences.cuisinePreference,
            priceRange: selectedPriceRanges.length > 0 ? selectedPriceRanges : undefined,
            openNow: openNowOnly,
            deliveryOnly,
            minRating: 3.5,
          }
        );
        setRestaurants(results);
      }
      
      setIsLoading(false);
    };
    
    loadRestaurants();
  }, [selectedAddress, selectedCuisines, selectedPriceRanges, openNowOnly, deliveryOnly, userPreferences.cuisinePreference]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedAddress) return;
    
    setIsLoading(true);
    const results = await restaurantService.searchRestaurants(
      selectedAddress.latitude,
      selectedAddress.longitude,
      searchQuery
    );
    setRestaurants(results);
    setIsLoading(false);
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const togglePriceRange = (price: number) => {
    setSelectedPriceRanges(prev => 
      prev.includes(price)
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{t('restaurant.title')}</h1>
              <p className="text-xs text-gray-500">
                {selectedAddress ? `${t('nav.near')} ${selectedAddress.name}` : t('settings.location')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10 pr-20"
            placeholder={t('restaurant.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            size="sm" 
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handleSearch}
          >
            {t('common.search')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="nearby">{t('restaurant.nearby')}</TabsTrigger>
            <TabsTrigger value="filters">{t('restaurant.filters')}</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="space-y-4">
            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant={openNowOnly ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setOpenNowOnly(!openNowOnly)}
              >
                <Clock className="w-3 h-3 mr-1" />
                {t('restaurant.openNow')}
              </Badge>
              <Badge
                variant={deliveryOnly ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setDeliveryOnly(!deliveryOnly)}
              >
                <Bike className="w-3 h-3 mr-1" />
                {t('restaurant.delivery')}
              </Badge>
              {userPreferences.cuisinePreference.slice(0, 2).map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  {t(`cuisines.${cuisine}`)}
                </Badge>
              ))}
            </div>

            {/* Restaurant List */}
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))
              ) : restaurants.length > 0 ? (
                restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('restaurant.noRestaurants')}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('restaurant.adjustFilters')}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            {/* Cuisine Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('restaurant.cuisine')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_FILTERS.map((cuisine) => (
                    <Badge
                      key={cuisine}
                      variant={selectedCuisines.includes(cuisine) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCuisine(cuisine)}
                    >
                      {t(`cuisines.${cuisine}`)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Range Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('restaurant.priceRange')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {PRICE_RANGES.map((price) => (
                    <Button
                      key={price}
                      variant={selectedPriceRanges.includes(price) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePriceRange(price)}
                    >
                      {'€'.repeat(price)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('restaurant.options')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('restaurant.openNow')}</span>
                  <Button
                    variant={openNowOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOpenNowOnly(!openNowOnly)}
                  >
                    {openNowOnly ? t('common.yes') : t('common.no')}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('restaurant.delivery')}</span>
                  <Button
                    variant={deliveryOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDeliveryOnly(!deliveryOnly)}
                  >
                    {deliveryOnly ? t('common.yes') : t('common.no')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              onClick={() => setActiveTab('nearby')}
            >
              {t('common.apply')}
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Restaurant Card Component
function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      {restaurant.rating}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ({restaurant.reviewCount} {t('restaurant.reviews')})
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                {restaurant.priceRange > 0 && (
                  <span className="text-lg">{'€'.repeat(restaurant.priceRange)}</span>
                )}
                {Object.keys(restaurant.openingHours).length > 0 &&
                  (restaurant.isOpen ? (
                    <Badge className="bg-green-500 text-white text-xs ml-2">{t('restaurant.open')}</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs ml-2">{t('restaurant.closed')}</Badge>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Navigation className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {restaurant.distance?.toFixed(1)} km {t('nav.near')}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                {restaurant.cuisineType.map(c => t(`cuisines.${c}`)).join(', ')}
              </span>
            </div>

            {restaurant.promotion && (
              <Badge className="mt-2 bg-orange-100 text-orange-700">
                <Tag className="w-3 h-3 mr-1" />
                {restaurant.promotion}
              </Badge>
            )}

            {restaurant.deliveryAvailable && (
              <Badge variant="outline" className="mt-2 ml-2">
                <Bike className="w-3 h-3 mr-1" />
                {t('restaurant.delivery')}
              </Badge>
            )}

            {isExpanded && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{restaurant.address}</span>
                  </div>
                  {restaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.featuredDishes && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('restaurant.featuredDishes')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {restaurant.featuredDishes.map((dish, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {dish}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {restaurant.website && (
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-1" />
                          {t('restaurant.website')}
                        </a>
                      </Button>
                    )}
                    <Button size="sm" className="flex-1">
                      <Navigation className="w-4 h-4 mr-1" />
                      {t('restaurant.directions')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('restaurant.showLess') : t('restaurant.showMore')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
