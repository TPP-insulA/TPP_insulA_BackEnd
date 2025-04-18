import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import Clarifai from 'clarifai';

export const processFoodImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  try {
    const PAT = process.env.CLARIFAI_PAT;
    if (!PAT) {
      throw new Error('CLARIFAI_PAT environment variable is not set');
    }
    
    // Initialize the Clarifai app with your API key
    const app = new Clarifai.App({
      apiKey: PAT
    });

    // Predict using the food model
    const response = await app.models.predict(
      'dfebc169854e429086aceb8368662641', // This is the food model ID in Clarifai v2
      { url: imageUrl }
    );

    // Extract the food name from the response
    if (response.outputs && 
        response.outputs[0] && 
        response.outputs[0].data && 
        response.outputs[0].data.concepts && 
        response.outputs[0].data.concepts.length > 0) {
      
      const foodName = response.outputs[0].data.concepts[0].name;
      res.json({ success: true, foodName });
    } else {
      res.status(404).json({ success: false, message: 'No food detected in the image' });
    }
  } catch (error) {
    console.error('Clarifai error:', error);
    res.status(500).json({ success: false, message: 'Failed to process image' });
  }
});