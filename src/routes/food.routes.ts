import { Router } from 'express';
import { processFoodImage } from '../controllers/food.controller';

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
 */
const router = Router();
router.post('/process-image', processFoodImage);

export default router;