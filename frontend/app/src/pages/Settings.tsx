import { OpenMap } from '@/components/OpenMap';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  Users, 
  Utensils, 
  AlertTriangle, 
  Heart, 
  ChefHat,
  MapPin,
  Key,
  Globe,
  Info,
  Plus,
  Trash2,
  Check,
  Save,
  Map as MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/store/useAppStore';
import { usePreferences } from '@/hooks/usePreferences';
import { supportedLanguages } from '@/i18n';
import { getGoogleMapsService } from '@/services/googleMaps';
import type { 
  CuisineType, 
  DietaryRestriction, 
  Allergy, 
  TasteType, 
  DifficultyLevel,
  HealthCondition,
  LLMProvider
} from '@/types';

const CUISINE_OPTIONS: { value: CuisineType; icon: string }[] = [
  { value: 'chinese', icon: '🥢' },
  { value: 'western', icon: '🍽️' },
  { value: 'asian', icon: '🍜' },
  { value: 'vegetarian', icon: '🥗' },
  { value: 'simple', icon: '🥪' },
  { value: 'fitness', icon: '💪' },
];

const DIETARY_OPTIONS: DietaryRestriction[] = ['halal', 'vegetarian', 'vegan', 'no_pork', 'kosher'];
const ALLERGY_OPTIONS: Allergy[] = ['peanut', 'seafood', 'lactose', 'gluten', 'egg', 'soy', 'tree_nuts'];
const TASTE_OPTIONS: TasteType[] = ['light', 'strong', 'sour_spicy', 'sweet', 'low_oil_salt'];
const DIFFICULTY_OPTIONS: DifficultyLevel[] = ['easy', 'medium', 'hard'];
const HEALTH_OPTIONS: HealthCondition[] = ['none', 'stomach_issue', 'cold', 'recovery', 'weight_loss', 'muscle_gain', 'sugar_control', 'salt_control'];

const LLM_PROVIDERS: { value: LLMProvider; label: string; models: string[] }[] = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'doubao', label: 'Doubao International', models: ['doubao-pro', 'doubao-lite'] },
  { value: 'tongyi', label: 'Ali Tongyi', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { value: 'custom', label: 'Custom', models: ['custom'] },
];

export function Settings() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('preferences');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Local state for API configs
  const [localLLMConfig, setLocalLLMConfig] = useState<{
    provider: LLMProvider;
    apiKey: string;
    model: string;
    baseUrl: string | undefined;
    timeout: number;
  }>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    baseUrl: undefined,
    timeout: 30000,
  });
  const [localMapsApiKey, setLocalMapsApiKey] = useState('');
  
  const { 
    preferences, 
    addresses,
    selectedAddress,
    setPeopleCount,
    setCuisinePreference,
    addDietaryRestriction,
    removeDietaryRestriction,
    addAllergy,
    removeAllergy,
    setTastePreference,
    setCookingDifficulty,
    setHealthConditions,
    setCustomHealthNote,
    addAddress,
    removeAddress,
    setDefaultAddress,
    setSelectedAddress,
  } = usePreferences();
  
  const { 
    llmConfig, 
    updateLLMConfig, 
    currentLanguage, 
    setLanguage,
    updateGoogleMapsApiKey,
    googleMapsApiKey,
  } = useAppStore();

  // Initialize local state from store
  useEffect(() => {
    setLocalLLMConfig({
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      model: llmConfig.model,
      baseUrl: llmConfig.baseUrl,
      timeout: llmConfig.timeout,
    });
    setLocalMapsApiKey(googleMapsApiKey || '');
  }, [llmConfig, googleMapsApiKey]);

  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    latitude: 52.5200,
    longitude: 13.4050,
    isDefault: false,
  });
  const [nearbySupermarkets, setNearbySupermarkets] = useState<any[]>([]);
  const [searchRadius, setSearchRadius] = useState(5000);
  
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
  
        try {
          // 反向解析地址
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
  
          const data = await response.json();
          const addressText = data.display_name || "Current Location";
  
          const newAutoAddress = {
            id: Date.now().toString(),
            name: "Current Location",
            address: addressText,
            latitude,
            longitude,
            isDefault: false,
          };
  
          addAddress(newAutoAddress);
          setSelectedAddress(newAutoAddress);
  
          // 搜索附近超市
          const supermarkets = await searchNearbySupermarkets(
            latitude,
            longitude
          );
  
          console.log("Nearby supermarkets:", supermarkets);
          setNearbySupermarkets(supermarkets);
  
        } catch (error) {
          console.error(error);
  
          const fallbackAddress = {
            id: Date.now().toString(),
            name: "Current Location",
            address: "Detected automatically",
            latitude,
            longitude,
            isDefault: false,
          };
  
          addAddress(fallbackAddress);
          setSelectedAddress(fallbackAddress);
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve location");
      }
    );
  };
  
  const searchNearbySupermarkets = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const radiusKm = searchRadius / 1000;
      const delta = radiusKm / 111;
  
      const minLat = latitude - delta;
      const maxLat = latitude + delta;
      const minLon = longitude - delta;
      const maxLon = longitude + delta;
  
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=supermarket&limit=15&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1`;
  
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });
  
      const data = await response.json();
  
      const supermarkets = data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name.split(",")[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
  
      return supermarkets;
  
    } catch (error) {
      console.error("Supermarket search failed:", error);
      return [];
    }
  };

  const handleAddAddress = async () => {
    if (newAddress.name && newAddress.address) {
      // Geocode address if Maps API is configured
      if (googleMapsApiKey) {
        const mapsService = getGoogleMapsService(googleMapsApiKey);
        const coords = await mapsService.geocodeAddress(newAddress.address);
        if (coords) {
          addAddress({ 
            ...newAddress, 
            latitude: coords.lat, 
            longitude: coords.lng 
          });
        } else {
          addAddress(newAddress);
        }
      } else {
        addAddress(newAddress);
      }
      setNewAddress({ name: '', address: '', latitude: 52.5200, longitude: 13.4050, isDefault: false });
    }
  };

  const handleSaveLLMConfig = () => {
    setSaveStatus('saving');
    updateLLMConfig(localLLMConfig);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleSaveMapsConfig = () => {
    setSaveStatus('saving');
    updateGoogleMapsApiKey(localMapsApiKey);
    getGoogleMapsService(localMapsApiKey);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  // Initialize language on mount
  useEffect(() => {
    if (currentLanguage && currentLanguage !== i18n.language) {
      i18n.changeLanguage(currentLanguage);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">{t('settings.title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
            <TabsTrigger value="health">{t('settings.health')}</TabsTrigger>
            <TabsTrigger value="location">{t('settings.location')}</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="language">
              <Globe className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            {/* People Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('settings.peopleCount')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[preferences.peopleCount]}
                    onValueChange={([v]) => setPeopleCount(v)}
                    min={1}
                    max={6}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-8 text-center font-semibold">{preferences.peopleCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cuisine Preference */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  {t('settings.cuisine')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <Badge
                      key={cuisine.value}
                      variant={preferences.cuisinePreference.includes(cuisine.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newPrefs = preferences.cuisinePreference.includes(cuisine.value)
                          ? preferences.cuisinePreference.filter(c => c !== cuisine.value)
                          : [...preferences.cuisinePreference, cuisine.value];
                        setCuisinePreference(newPrefs);
                      }}
                    >
                      {cuisine.icon} {t(`cuisines.${cuisine.value}`)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dietary Restrictions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('settings.dietary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((diet) => (
                    <Badge
                      key={diet}
                      variant={preferences.dietaryRestrictions.includes(diet) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (preferences.dietaryRestrictions.includes(diet)) {
                          removeDietaryRestriction(diet);
                        } else {
                          addDietaryRestriction(diet);
                        }
                      }}
                    >
                      {t(`dietary.${diet}`)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  {t('settings.allergies')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant={preferences.allergies.includes(allergy) ? "destructive" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (preferences.allergies.includes(allergy)) {
                          removeAllergy(allergy);
                        } else {
                          addAllergy(allergy);
                        }
                      }}
                    >
                      {t(`allergies.${allergy}`)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Taste Preference */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {t('settings.taste')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {TASTE_OPTIONS.map((taste) => (
                    <Button
                      key={taste}
                      variant={preferences.tastePreference === taste ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTastePreference(taste)}
                    >
                      {t(`taste.${taste}`)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cooking Difficulty */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  {t('settings.difficulty')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((diff) => (
                    <Button
                      key={diff}
                      variant={preferences.cookingDifficulty === diff ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCookingDifficulty(diff)}
                    >
                      {t(`settings.difficultyOptions.${diff}`)}
                      <span className="block text-xs opacity-70">
                        {t(`settings.difficultyOptions.${diff}Time`)}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  {t('settings.healthConditions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">
                  {t('settings.healthDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_OPTIONS.map((health) => (
                    <Badge
                      key={health}
                      variant={preferences.healthConditions.includes(health) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newConditions = preferences.healthConditions.includes(health)
                          ? preferences.healthConditions.filter(h => h !== health)
                          : [...preferences.healthConditions, health];
                        setHealthConditions(newConditions);
                      }}
                    >
                      {t(`settings.healthOptions.${health}`)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('settings.customHealthNote')}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border rounded-lg text-sm"
                  rows={3}
                  placeholder={t('settings.healthPlaceholder')}
                  value={preferences.customHealthNote || ''}
                  onChange={(e) => setCustomHealthNote(e.target.value)}
                />
              </CardContent>
            </Card>
            
          </TabsContent>

         {/* Location Tab */}
<TabsContent value="location" className="space-y-4">

{/* 地址管理卡片 */}
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm flex items-center gap-2">
      <MapPin className="w-4 h-4" />
      {t('settings.savedAddresses')}
    </CardTitle>
  </CardHeader>

  <CardContent>

    {/* 📍 自动定位按钮 */}
    <Button
      variant="outline"
      className="w-full mb-3"
      onClick={detectCurrentLocation}
    >
      📍 Use Current Location
    </Button>
    <div className="mb-3">
  <Label>Search Radius (km)</Label>
  <Slider
    value={[searchRadius / 1000]}
    onValueChange={([v]) => setSearchRadius(v * 1000)}
    min={1}
    max={20}
    step={1}
  />
  <div className="text-sm text-gray-500">
    Current: {searchRadius / 1000} km
  </div>
</div>
    {/* 地址列表 */}
    <div className="space-y-2 mb-4">
      {addresses.map((addr) => (
        <div 
          key={addr.id} 
          className={`p-3 border rounded-lg flex items-center justify-between ${
            selectedAddress?.id === addr.id ? 'border-green-500 bg-green-50' : ''
          }`}
        >
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setSelectedAddress(addr)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{addr.name}</span>
              {addr.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  {t('settings.default')}
                </Badge>
              )}
              {selectedAddress?.id === addr.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500">{addr.address}</p>
          </div>

          <div className="flex gap-1">
            {!addr.isDefault && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setDefaultAddress(addr.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-red-500"
              onClick={() => removeAddress(addr.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>

    {/* 添加地址对话框 */}
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          {t('settings.addAddress')}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.addAddress')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label>{t('settings.addressName')}</Label>
            <Input
              value={newAddress.name}
              onChange={(e) =>
                setNewAddress({ ...newAddress, name: e.target.value })
              }
              placeholder="Home"
            />
          </div>

          <div>
            <Label>{t('settings.fullAddress')}</Label>
            <Input
              value={newAddress.address}
              onChange={(e) =>
                setNewAddress({ ...newAddress, address: e.target.value })
              }
              placeholder="123 Main St"
            />
          </div>

          <Button onClick={handleAddAddress} className="w-full">
            {t('common.add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  </CardContent>
</Card>

{/* 地图预览（只保留一份） */}
{selectedAddress && (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <MapIcon className="w-4 h-4" />
        Map Preview
      </CardTitle>
    </CardHeader>

    <CardContent>
    <OpenMap
  latitude={selectedAddress.latitude}
  longitude={selectedAddress.longitude}
  label={selectedAddress.name}
  supermarkets={nearbySupermarkets}
  radius={searchRadius}
/>
    </CardContent>
  </Card>
)}

</TabsContent>
          {/* API Tab */}
          <TabsContent value="api" className="space-y-4">
            {/* LLM API Configuration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {t('settings.llmConfig')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('settings.provider')}</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {LLM_PROVIDERS.map((provider) => (
                      <Button
                        key={provider.value}
                        variant={localLLMConfig.provider === provider.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLocalLLMConfig({ ...localLLMConfig, provider: provider.value })}
                      >
                        {provider.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>{t('settings.apiKey')}</Label>
                  <Input
                    type="password"
                    value={localLLMConfig.apiKey}
                    onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <Label>{t('settings.model')}</Label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={localLLMConfig.model}
                    onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, model: e.target.value })}
                  >
                    {LLM_PROVIDERS.find(p => p.value === localLLMConfig.provider)?.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {localLLMConfig.provider === 'custom' && (
                  <div>
                    <Label>{t('settings.baseUrl')}</Label>
                    <Input
                      value={localLLMConfig.baseUrl || ''}
                      onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                )}

                <div>
                  <Label>{t('settings.timeout')}</Label>
                  <Input
                    type="number"
                    value={localLLMConfig.timeout}
                    onChange={(e) => setLocalLLMConfig({ ...localLLMConfig, timeout: parseInt(e.target.value) })}
                  />
                </div>

                <Button 
                  onClick={handleSaveLLMConfig} 
                  className="w-full gap-2"
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saved' ? (
                    <><Check className="w-4 h-4" /> Saved</>
                  ) : saveStatus === 'saving' ? (
                    <>{t('common.save')}...</>
                  ) : (
                    <><Save className="w-4 h-4" /> {t('common.save')}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Google Maps API Configuration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapIcon className="w-4 h-4" />
                  Google Maps API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={localMapsApiKey}
                    onChange={(e) => setLocalMapsApiKey(e.target.value)}
                    placeholder="AIza..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for accurate location search and supermarket finding
                  </p>
                </div>

                <Button 
                  onClick={handleSaveMapsConfig} 
                  className="w-full gap-2"
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saved' ? (
                    <><Check className="w-4 h-4" /> Saved</>
                  ) : saveStatus === 'saving' ? (
                    <>{t('common.save')}...</>
                  ) : (
                    <><Save className="w-4 h-4" /> {t('common.save')}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('settings.language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {supportedLanguages.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={currentLanguage === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLanguageChange(lang.code)}
                      className="justify-start gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Current: {supportedLanguages.find(l => l.code === currentLanguage)?.name || 'English'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  {t('settings.about')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {t('settings.version')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('settings.aboutDesc')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
