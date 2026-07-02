import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Store,
  Search,
  TrendingDown,
  Clock,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import {
  getNearbySupermarkets,
  getSupermarketDeals,
  mapDealsToDiscountItems,
  type BackendStore,
} from '@/services/api';
import type { DiscountItem, FoodCategory } from '@/types';

const CATEGORY_ICONS: Record<FoodCategory, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  meat: '🥩',
  fish: '🐟',
  dairy_eggs: '🥚',
  grains: '🌾',
  snacks: '🍿',
  beverages: '🥤',
};

export function SupermarketPage() {
  const { t } = useTranslation();
  const [discountItems, setDiscountItems] = useState<DiscountItem[]>([]);
  const [stores, setStores] = useState<BackendStore[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [dealCounts, setDealCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [activeTab, setActiveTab] = useState('deals');

  const { selectedAddress } = useAppStore();

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const { stores: backendStores, region } = await getNearbySupermarkets(
        selectedAddress?.latitude,
        selectedAddress?.longitude
      );
      setStores(backendStores);
      setRegion(region);

      const allDiscounts: DiscountItem[] = [];
      const counts: Record<string, number> = {};

      // Fetch each store's parsed flyer deals from the backend.
      const results = await Promise.all(
        backendStores.map(async (store) => {
          try {
            const data = await getSupermarketDeals(
              store.id,
              refresh,
              selectedAddress?.latitude,
              selectedAddress?.longitude
            );
            return mapDealsToDiscountItems(store.id, store.name, data.usedDiscountItems || []);
          } catch (err) {
            console.error(`Failed to load deals for ${store.id}:`, err);
            return [] as DiscountItem[];
          }
        })
      );

      backendStores.forEach((store, i) => {
        counts[store.id] = results[i].length;
        allDiscounts.push(...results[i]);
      });

      allDiscounts.sort((a, b) => b.discountPercentage - a.discountPercentage);
      setDiscountItems(allDiscounts);
      setDealCounts(counts);

      if (allDiscounts.length === 0) {
        setError(t('supermarket.noDeals') || 'No deals available right now.');
      }
    } catch (err) {
      console.error('Failed to load supermarket data:', err);
      setError(t('supermarket.loadError') || 'Failed to load supermarket deals.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress]);

  const filteredItems = discountItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const bestDeals = discountItems.slice(0, 5);
  
  const categories: { id: FoodCategory; name: string }[] = [
    { id: 'vegetables', name: t('supermarket.categories.vegetables') },
    { id: 'fruits', name: t('supermarket.categories.fruits') },
    { id: 'meat', name: t('supermarket.categories.meat') },
    { id: 'fish', name: t('supermarket.categories.fish') },
    { id: 'dairy_eggs', name: t('supermarket.categories.dairy_eggs') },
    { id: 'grains', name: t('supermarket.categories.grains') },
    { id: 'snacks', name: t('supermarket.categories.snacks') },
    { id: 'beverages', name: t('supermarket.categories.beverages') },
  ];

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
              <h1 className="text-lg font-bold text-gray-900">{t('supermarket.title')}</h1>
              <p className="text-xs text-gray-500">
                {selectedAddress ? `${t('nav.near')} ${selectedAddress.name}` : t('settings.location')}
                {region ? ` · ${region}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLoading || isRefreshing}
              onClick={() => loadData(true)}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Error */}
        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder={t('supermarket.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="deals">{t('supermarket.bestDeals')}</TabsTrigger>
            <TabsTrigger value="stores">{t('supermarket.stores')}</TabsTrigger>
          </TabsList>

          <TabsContent value="deals" className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(null)}
              >
                {t('supermarket.all')}
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {CATEGORY_ICONS[cat.id]} {cat.name}
                </Badge>
              ))}
            </div>

            {/* Best Deals Section */}
            {!selectedCategory && !searchQuery && (
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <TrendingDown className="w-4 h-4" />
                    {t('supermarket.topSavings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : (
                      bestDeals.slice(0, 3).map((deal) => (
                        <div 
                          key={deal.id} 
                          className="flex items-center justify-between bg-white/10 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_ICONS[deal.category]}</span>
                            <div>
                              <p className="font-medium text-sm">{deal.name}</p>
                              <p className="text-xs opacity-80">{deal.supermarketName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-red-500 text-white">-{deal.discountPercentage}%</Badge>
                            <p className="text-xs mt-1">
                              <span className="line-through opacity-60">€{deal.originalPrice}</span>
                              <span className="font-bold ml-1">€{deal.discountPrice}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Deals */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                {selectedCategory ? t('supermarket.bestDeals') : t('supermarket.all')}
              </h2>
              <div className="space-y-3">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <DiscountCard key={item.id} item={item} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No deals found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : stores.length > 0 ? (
              stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  dealCount={dealCounts[store.id] ?? 0}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {selectedAddress
                    ? t('supermarket.notCovered') || 'No supported supermarkets in your area yet.'
                    : t('settings.location')}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Discount Card Component
function DiscountCard({ item }: { item: DiscountItem }) {
  const { t } = useTranslation();
  const validTo = new Date(item.validTo);
  const daysLeft = Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {CATEGORY_ICONS[item.category]}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.supermarketName}</p>
              </div>
              <Badge className="bg-red-500 text-white">-{item.discountPercentage}%</Badge>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-bold text-green-600">€{item.discountPrice}</span>
              <span className="text-sm text-gray-400 line-through">€{item.originalPrice}</span>
              {item.unit && (
                <span className="text-xs text-gray-500">/ {item.unit}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${daysLeft <= 2 ? 'text-red-500' : 'text-gray-500'}`}>
                {daysLeft > 0 ? `${daysLeft} ${t('supermarket.daysLeft')}` : t('supermarket.expiresToday')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Store Card Component (backed by /nearby-supermarkets)
function StoreCard({ store, dealCount }: { store: BackendStore; dealCount: number }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              {store.distance != null ? (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {store.distance} km · {store.branch || store.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  {dealCount} {t('supermarket.dealsAvailable') || 'deals available'}
                </p>
              )}
              {store.distance != null && (
                <p className="text-xs text-gray-400">
                  {dealCount} {t('supermarket.dealsAvailable') || 'deals available'}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <TrendingDown className="w-3 h-3 mr-1" />
            {dealCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
