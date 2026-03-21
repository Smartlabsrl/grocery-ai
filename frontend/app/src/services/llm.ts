import type { 
  LLMConfig, 
  LLMMessage, 
  Recipe, 
  DailyMenu, 
  UserPreferences,
  DiscountItem 
} from '@/types';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<LLMConfig>) {
    this.config = { ...this.config, ...config };
  }

  private getBaseUrl(): string {
    return "";
  }
  

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (this.config.provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'doubao':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'tongyi':
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = this.config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
    }

    return headers;
  }

  private async makeRequest(messages: LLMMessage[]): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/chat/completions`;
  
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }
  
      const data = await response.json();
  
      // 🔥 打印完整返回（非常重要）
      console.log("LLM Raw Response:", data);
  
      if (!data.choices || !data.choices.length) {
        throw new Error(
          `LLM返回格式异常: ${JSON.stringify(data)}`
        );
      }
  
      return data.choices[0]?.message?.content || '';
  
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("LLM Request Failed:", error);
      throw error;
    }
  }
  async generateDailyMenu(
    preferences: UserPreferences,
    discountItems: DiscountItem[],
    previousRecipes: string[] = []
  ): Promise<DailyMenu> {
    const systemPrompt = `You are an expert nutritionist and chef specializing in creating personalized daily meal plans. 
Your task is to generate a complete daily menu (breakfast, lunch, dinner) based on user preferences and available discount ingredients.

Rules:
1. All three meals must be different and non-repetitive
2. Prioritize using discount ingredients when possible
3. Consider dietary restrictions, allergies, and health conditions
4. Match the cooking difficulty preference
5. Provide detailed ingredients with amounts and cooking steps
6. Include nutritional information for each meal
7. Avoid previously served recipes
8. Adapt recipes for the specified number of people

Output must be valid JSON in this exact format:
{
  "breakfast": {
    "id": "unique-id",
    "name": "Recipe Name",
    "mealType": "breakfast",
    "cuisineType": "chinese|western|asian|vegetarian|simple|fitness",
    "ingredients": [
      {"name": "ingredient name", "amount": "quantity", "isDiscounted": true/false}
    ],
    "steps": ["step 1", "step 2", ...],
    "estimatedTime": minutes,
    "difficulty": "easy|medium|hard",
    "nutrition": {"protein": "Xg", "carbs": "Xg", "vegetables": "Xserving"},
    "servings": number
  },
  "lunch": { ...same structure... },
  "dinner": { ...same structure... },
  "usedDiscountItems": ["item1", "item2"]
}`;

    const userPrompt = `Generate a daily menu with these preferences:
- People: ${preferences.peopleCount}
- Cuisine: ${preferences.cuisinePreference.join(', ')}
- Dietary restrictions: ${preferences.dietaryRestrictions.join(', ') || 'none'}
- Allergies: ${preferences.allergies.join(', ') || 'none'}
- Taste: ${preferences.tastePreference}
- Difficulty: ${preferences.cookingDifficulty}
- Health conditions: ${preferences.healthConditions.join(', ') || 'none'}
${preferences.customHealthNote ? `- Health note: ${preferences.customHealthNote}` : ''}
- Previous recipes to avoid: ${previousRecipes.slice(0, 20).join(', ') || 'none'}

Available discount ingredients:
${discountItems.map(item => `- ${item.name} (${item.category}): €${item.discountPrice} at ${item.supermarketName}`).join('\n') || 'None available'}

Generate the complete daily menu now.`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from LLM');
      }

      const menuData = JSON.parse(jsonMatch[0]);
      
      return {
        date: new Date().toISOString().split('T')[0],
        breakfast: menuData.breakfast,
        lunch: menuData.lunch,
        dinner: menuData.dinner,
        isGenerated: true,
        usedDiscountItems: discountItems.filter(item => 
          menuData.usedDiscountItems?.includes(item.name)
        ),
      };
    } catch (error) {
      console.error('Failed to generate menu:', error);
      throw error;
    }
  }

  async generateHealthFocusedRecipe(
    healthCondition: string,
    preferences: UserPreferences,
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ): Promise<Recipe> {
    const systemPrompt = `You are a therapeutic nutrition specialist. Create a healing/recovery focused recipe.

Output must be valid JSON:
{
  "id": "unique-id",
  "name": "Recipe Name",
  "mealType": "${mealType}",
  "cuisineType": "chinese|western|asian|vegetarian|simple|fitness",
  "ingredients": [{"name": "...", "amount": "..."}],
  "steps": ["..."],
  "estimatedTime": number,
  "difficulty": "easy|medium|hard",
  "nutrition": {"protein": "Xg", "carbs": "Xg", "vegetables": "Xserving"},
  "servings": number,
  "healthTags": ["..."]
}`;

    const userPrompt = `Create a ${mealType} recipe for someone with: ${healthCondition}
Preferences: ${preferences.cuisinePreference.join(', ')}, ${preferences.tastePreference} taste
Avoid: ${preferences.allergies.join(', ') || 'nothing'}
For ${preferences.peopleCount} people.`;

    const response = await this.makeRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    
    return JSON.parse(jsonMatch[0]);
  }

  async suggestRestaurants(
    preferences: UserPreferences,
    location: { latitude: number; longitude: number },
    cuisineType?: string
  ): Promise<string[]> {
    const systemPrompt = `You are a local restaurant expert. Suggest restaurant search keywords based on user preferences.

Output valid JSON array of strings: ["keyword1", "keyword2", ...]`;

    const userPrompt = `Suggest restaurant search keywords for:
- Location: ${location.latitude}, ${location.longitude}
- Preferred cuisine: ${cuisineType || preferences.cuisinePreference.join(', ')}
- Dietary needs: ${preferences.dietaryRestrictions.join(', ') || 'none'}
- Taste preference: ${preferences.tastePreference}

Return 5-8 relevant search keywords.`;

    const response = await this.makeRequest([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return [cuisineType || 'restaurant', 'food near me'];
    }
  }
}

// Singleton instance
let llmServiceInstance: LLMService | null = null;

export function getLLMService(config?: LLMConfig): LLMService {
  if (!llmServiceInstance || config) {
    llmServiceInstance = new LLMService(config || {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4',
      timeout: 30000,
    });
  }
  return llmServiceInstance;
}
