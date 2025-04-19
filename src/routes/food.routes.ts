import { Router } from 'express';
import { processFoodImage, processFoodName } from '../controllers/food.controller';

/**
 * @swagger
 * tags:
 *   name: Food
 *   description: Food recognition and nutritional information
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FoodPrediction:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the identified food
 *         probability:
 *           type: number
 *           description: Confidence score of the prediction
 *     NutritionInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the food item
 *         calories:
 *           type: number
 *           description: Total calories
 *         carbs_g:
 *           type: number
 *           description: Total carbohydrates in grams
 *         protein_g:
 *           type: number
 *           description: Total protein in grams
 *         fat_g:
 *           type: number
 *           description: Total fat in grams
 *         serving_size_g:
 *           type: number
 *           description: Serving size in grams
 */

const router = Router();

/**
 * @swagger
 * /api/food/process-image:
 *   post:
 *     summary: Identify food from an image using Clarifai AI
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the food image to analyze
 *     responses:
 *       200:
 *         description: Food successfully identified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 foodName:
 *                   type: string
 *                   example: "pizza"
 *                 predictions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FoodPrediction'
 *       400:
 *         description: Invalid request or missing image URL
 *       500:
 *         description: Server error or Clarifai API error
 */
router.post('/process-image', processFoodImage);

/**
 * @swagger
 * /api/food/process-food-name:
 *   post:
 *     summary: Get nutritional information for food items
 *     tags: [Food]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Food description (e.g., "3lb carrots and a chicken sandwich")
 *                 example: "3lb carrots and a chicken sandwich"
 *     responses:
 *       200:
 *         description: Nutritional information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NutritionInfo'
 *       400:
 *         description: Invalid request or missing query
 *       500:
 *         description: Server error or CalorieNinja API error
 */
router.post('/process-food-name', processFoodName);

// Debug route to verify router is working
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Food router is working',
    availableRoutes: [
      { path: '/process-image', method: 'POST' },
      { path: '/process-food-name', method: 'POST' }
    ],
    environmentInfo: {
      nodeEnv: process.env.NODE_ENV,
      hasNinjaKey: !!process.env.NINJA_CALORIE_API_KEY
    }
  });
});

export default router;