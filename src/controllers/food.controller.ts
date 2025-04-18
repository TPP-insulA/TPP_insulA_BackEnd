import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { Model, Inputs } from 'clarifai';

export const processFoodImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  try {
    const PAT = process.env.CLARIFAI_PAT;
    const model = new Model({ url: 'https://clarifai.com/clarifai/main/models/food-item-v1-recognition', pat: PAT });
    const input = Inputs.getInputFromUrl({ url: imageUrl });
    const prediction = await model.predict([input], { inputType: 'image' });
    const foodName = prediction.outputs[0].data.concepts[0].name;

    res.json({ success: true, foodName });
  } catch (error) {
    console.error('Clarifai error:', error);
    res.status(500).json({ success: false, message: 'Failed to process image' });
  }
});