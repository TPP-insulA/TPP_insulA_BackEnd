import { Router } from 'express';
import { getMeals, createMeal, deleteMeal, updateMeal } from '../controllers/meals.controller';
import { protect } from '../middleware/auth.middleware';
import { MealType } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal tracking and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FoodItem:
 *       type: object
 *       required:
 *         - name
 *         - carbs
 *         - protein
 *         - fat
 *         - calories
 *         - servingSize
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the food item
 *         carbs:
 *           type: number
 *           description: Carbohydrates in grams
 *         protein:
 *           type: number
 *           description: Protein in grams
 *         fat:
 *           type: number
 *           description: Fat in grams
 *         calories:
 *           type: number
 *           description: Calories per serving
 *         servingSize:
 *           type: number
 *           description: Serving size in grams
 *         quantity:
 *           type: number
 *           description: Number of servings
 *     Meal:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - foods
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the meal
 *         name:
 *           type: string
 *           description: Name of the meal
 *         description:
 *           type: string
 *           description: Optional description of the meal
 *         type:
 *           type: string
 *           enum: [breakfast, lunch, snack, dinner]
 *           description: Type of meal
 *         foods:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FoodItem'
 *           description: Array of food items in the meal
 *         photo:
 *           type: string
 *           description: Optional URL to meal photo
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the meal was consumed
 *         totalCarbs:
 *           type: number
 *           description: Total carbohydrates for the meal (calculated from foods)
 *         totalProtein:
 *           type: number
 *           description: Total protein for the meal (calculated from foods)
 *         totalFat:
 *           type: number
 *           description: Total fat for the meal (calculated from foods)
 *         totalCalories:
 *           type: number
 *           description: Total calories for the meal (calculated from foods)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const router = Router();

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Fetch all meals for the authenticated user
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering meals
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering meals
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Maximum number of meals to return
 *     responses:
 *       200:
 *         description: List of meals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meal'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', protect, getMeals);

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Create a new meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - foods
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the meal
 *               description:
 *                 type: string
 *                 description: Optional description of the meal
 *               type:
 *                 type: string
 *                 enum: [breakfast, lunch, snack, dinner]
 *                 description: Type of meal
 *               foods:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FoodItem'
 *                 description: Array of food items in the meal
 *               timestamp:
 *                 type: string
 *                 description: When the meal was consumed
 *               photo:
 *                 type: string
 *                 description: Optional URL to meal photo
 *     responses:
 *       201:
 *         description: Meal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create meal
 */
router.post('/', protect, createMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     summary: Delete a meal by ID
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the meal to delete
 *     responses:
 *       200:
 *         description: Meal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Failed to delete meal
 */
router.delete('/:id', protect, deleteMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   put:
 *     summary: Update an existing meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the meal to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the meal
 *               description:
 *                 type: string
 *                 description: Optional description of the meal
 *               type:
 *                 type: string
 *                 enum: [breakfast, lunch, snack, dinner]
 *                 description: Type of meal
 *               foods:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FoodItem'
 *                 description: Array of food items in the meal
 *               timestamp:
 *                 type: string
 *                 description: When the meal was consumed
 *               photo:
 *                 type: string
 *                 description: Optional URL to meal photo
 *     responses:
 *       200:
 *         description: Meal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Failed to update meal
 */
router.put('/:id', protect, updateMeal);

export default router;