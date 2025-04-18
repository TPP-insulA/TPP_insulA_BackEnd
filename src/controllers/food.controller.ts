import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

// Import the new Clarifai client library
import { Clarifai } from 'clarifai';

export const processFoodImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  try {
    // Use the PAT from environment variables or use the one from the Python example as fallback
    const PAT = process.env.CLARIFAI_PAT || "a570ad1225604fa9ad3359abbcc02787";
    
    // Initialize the Clarifai client
    const client = new Clarifai({
      apiKey: PAT,
    });

    // Define the model URL similar to the Python example
    const modelURL = "https://clarifai.com/clarifai/main/models/food-item-v1-recognition";
    
    // Make the prediction request
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
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'No food detected in the image' 
      });
    }
  } catch (error: any) {
    console.error('Error al usar la API de Clarifai:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error processing image: ${error.message || 'Unknown error'}`
    });
  }
});