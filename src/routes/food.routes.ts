import { Router } from 'express';
import { processFoodImage, processFoodName } from '../controllers/food.controller';

/**
 * @swagger
 * /api/food/process-image:
 *   post:
 *     summary: Process a food image using Clarifai API
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
 *       400:
 *         description: Invalid request or missing image URL
 *       500:
 *         description: Server error or Clarifai API error
 * 
 * /api/food/process-food-name:
 *   post:
 *     summary: Get nutritional information for a food query
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
 *                 description: Food query to analyze (e.g., "3lb carrots and a chicken sandwich")
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
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "carrots"
 *                       calories:
 *                         type: number
 *                         example: 477.8
 *                       carbs_g:
 *                         type: number
 *                         example: 110.2
 *                       protein_g:
 *                         type: number
 *                         example: 10.3
 *                       fat_g:
 *                         type: number
 *                         example: 2.3
 *                       serving_size_g:
 *                         type: number
 *                         example: 1360.77
 *       400:
 *         description: Invalid request or missing food query
 *       500:
 *         description: Server error or CalorieNinja API error
 */
const router = Router();
router.post('/process-image', processFoodImage);
router.post('/process-food-name', processFoodName);

export default router;