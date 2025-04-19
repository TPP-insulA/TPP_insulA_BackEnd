import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

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

interface ClarifaiConcept {
  id: string;
  name: string;
  value: number;
  app_id: string;
}

interface ClarifaiOutput {
  id: string;
  data: {
    concepts: ClarifaiConcept[];
  };
}

interface ClarifaiResponse {
  status: {
    code: number;
    description: string;
  };
  outputs: ClarifaiOutput[];
}

export const processFoodImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    res.status(400).json({ success: false, message: 'Image URL is required' });
    return;
  }

  try {
    const PAT = process.env.CLARIFAI_PAT;
    
    if (!PAT) {
      throw new Error('CLARIFAI_PAT environment variable is not set');
    }

    const raw = JSON.stringify({
      "user_app_id": {
        "user_id": "clarifai",
        "app_id": "main"
      },
      "inputs": [
        {
          "data": {
            "image": {
              "url": imageUrl
            }
          }
        }
      ]
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
      },
      body: raw
    };

    const response = await fetch("https://api.clarifai.com/v2/models/food-item-recognition/outputs", requestOptions);
    const result = await response.json() as ClarifaiResponse;

    if (!response.ok) {
      throw new Error(`Clarifai API error: ${response.status}`);
    }

    // Check if we have valid outputs
    if (result?.outputs?.[0]?.data?.concepts) {
      const concepts = result.outputs[0].data.concepts;
      
      // Create an array of food predictions with probabilities
      const predictions = concepts.map(concept => ({
        name: concept.name,
        probability: concept.value
      }));
      
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
    console.error('Error processing image:', error);
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