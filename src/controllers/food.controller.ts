import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Clarifai } from 'clarifai';

interface NutritionItem {
  name: string;
  calories: number;
  carbohydrates_total_g: number;
  protein_g: number;
  fat_total_g: number;
  serving_size_g: number;
}

interface NutritionResponse {
  items: NutritionItem[];
}

export const processFoodImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    res.status(400).json({ success: false, message: 'Image URL is required' });
    return;
  }

  try {
    const PAT = process.env.CLARIFAI_PAT || "a570ad1225604fa9ad3359abbcc02787";
    
    const client = new Clarifai({
      apiKey: PAT,
    });

    const modelURL = "https://clarifai.com/clarifai/main/models/food-item-v1-recognition";
    
    const response = await client.predict({
      modelUrl: modelURL,
      inputs: [
        {
          data: {
            image: {
              url: imageUrl
            }
          }
        }
      ]
    });

    // Check if we have valid outputs
    if (response && 
        response.outputs && 
        response.outputs[0] && 
        response.outputs[0].data && 
        response.outputs[0].data.concepts) {
      
      // Extract concepts (food labels) from the output
      const concepts = response.outputs[0].data.concepts;
      
      // Create an array of food predictions with probabilities
      const predictions = concepts.map(concept => ({
        name: concept.name,
        probability: concept.value
      }));
      
      // Return the identified foods with their probabilities
      res.json({
        success: true,
        foodName: predictions[0].name,
        predictions: predictions
      });
      return;
    }

    res.status(404).json({ 
      success: false, 
      message: 'No food detected in the image' 
    });
    return;
  } catch (error: any) {
    console.error('Error al usar la API de Clarifai:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error processing image: ${error.message || 'Unknown error'}` 
    });
    return;
  }
});

export const processFoodName = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;

  if (!query) {
    res.status(400).json({ 
      success: false, 
      message: 'Food query is required' 
    });
    return;
  }

  try {
    const NINJA_API_KEY = process.env.NINJA_CALORIE_API_KEY;
    
    if (!NINJA_API_KEY) {
      throw new Error('NINJA_CALORIE_API_KEY environment variable is not set');
    }

    const response = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Api-Key': NINJA_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CalorieNinja API error: ${response.status}`);
    }

    // Use type assertion to ensure type safety
    const data = await response.json() as NutritionResponse;

    // Transform the response to include only the requested macros
    const simplifiedNutrition = data.items.map(item => ({
      name: item.name,
      calories: item.calories,
      carbs_g: item.carbohydrates_total_g,
      protein_g: item.protein_g,
      fat_g: item.fat_total_g,
      serving_size_g: item.serving_size_g
    }));

    res.json({
      success: true,
      items: simplifiedNutrition
    });
    return;

  } catch (error: any) {
    console.error('Error fetching nutrition data:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error processing food query: ${error.message}` 
    });
    return;
  }
});