import { Router } from 'express';
import {
  updateInsulinPrediction,
  deleteInsulinPrediction,
  calculateInsulinPrediction,
  getInsulinPredictions,
} from '../controllers/insulin.controller';
import { protect } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

/**
 * @swagger
 * tags:
 *   name: Insulin
 *   description: Insulin doses management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InsulinPrediction:
 *       type: object
 *       required:
 *         - date
 *         - cgmPrev
 *         - glucoseObjective
 *         - carbs
 *         - insulinOnBoard
 *         - sleepLevel
 *         - workLevel
 *         - activityLevel
 *         - recommendedDose
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the prediction
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the prediction
 *         cgmPrev:
 *           type: array
 *           items:
 *             type: number
 *           description: Previous CGM readings
 *         glucoseObjective:
 *           type: number
 *           description: Glucose target value
 *         carbs:
 *           type: number
 *           description: Carbohydrates intake
 *         insulinOnBoard:
 *           type: number
 *           description: Insulin on board
 *         sleepLevel:
 *           type: number
 *           description: Sleep level
 *         workLevel:
 *           type: number
 *           description: Work level
 *         activityLevel:
 *           type: number
 *           description: Activity level
 *         recommendedDose:
 *           type: number
 *           description: Recommended insulin dose
 *         applyDose:
 *           type: number
 *           nullable: true
 *           description: Actual dose applied (if any)
 *         cgmPost:
 *           type: array
 *           items:
 *             type: number
 *           description: CGM readings after dose (if any)
 */

/**
 * @swagger
 * /api/insulin/calculate:
 *   post:
 *     tags: [Insulin]
 *     summary: Calculate insulin dose prediction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - cgmPrev
 *               - glucoseObjective
 *               - carbs
 *               - insulinOnBoard
 *               - sleepLevel
 *               - workLevel
 *               - activityLevel
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of the prediction
 *                 example: "2024-03-20T14:30:00Z"
 *               cgmPrev:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of previous CGM values
 *                 example: [120, 125, 130, 135, 140]
 *               glucoseObjective:
 *                 type: number
 *                 description: Target glucose level
 *                 example: 100
 *               carbs:
 *                 type: number
 *                 description: Amount of carbohydrates
 *                 example: 45
 *               insulinOnBoard:
 *                 type: number
 *                 description: Current insulin on board
 *                 example: 2.5
 *               sleepLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Sleep level (1-3)
 *                 example: 1
 *               workLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Work level (1-3)
 *                 example: 2
 *               activityLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Activity level (1-3)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Insulin prediction calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Prediction ID
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 cgmPrev:
 *                   type: array
 *                   items:
 *                     type: number
 *                 glucoseObjective:
 *                   type: number
 *                 carbs:
 *                   type: number
 *                 insulinOnBoard:
 *                   type: number
 *                 sleepLevel:
 *                   type: number
 *                 workLevel:
 *                   type: number
 *                 activityLevel:
 *                   type: number
 *                 recommendedDose:
 *                   type: number
 *                 applyDose:
 *                   type: number
 *                   nullable: true
 *                 cgmPost:
 *                   type: array
 *                   items:
 *                     type: number
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/insulin/predictions:
 *   get:
 *     summary: Obtener predicciones de insulina del usuario
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de predicciones de insulina
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InsulinPrediction'
 */

/**
 * @swagger
 * /api/insulin/{id}:
 *   put:
 *     tags: [Insulin]
 *     summary: Update insulin prediction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applyDose
 *               - cgmPost
 *             properties:
 *               applyDose:
 *                 type: number
 *                 description: Applied insulin dose
 *               cgmPost:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Post-dose CGM values
 *     responses:
 *       200:
 *         description: Prediction updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags: [Insulin]
 *     summary: Delete insulin prediction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     responses:
 *       200:
 *         description: Prediction deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 */

const router = Router();

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use(protect);
router.use(apiLimiter);

/**
 * @swagger
 * /api/insulin/calculate:
 *   post:
 *     tags: [Insulin]
 *     summary: Calculate insulin dose prediction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - cgmPrev
 *               - glucoseObjective
 *               - carbs
 *               - insulinOnBoard
 *               - sleepLevel
 *               - workLevel
 *               - activityLevel
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time of the prediction
 *                 example: "2024-03-20T14:30:00Z"
 *               cgmPrev:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of previous CGM values
 *                 example: [120, 125, 130, 135, 140]
 *               glucoseObjective:
 *                 type: number
 *                 description: Target glucose level
 *                 example: 100
 *               carbs:
 *                 type: number
 *                 description: Amount of carbohydrates
 *                 example: 45
 *               insulinOnBoard:
 *                 type: number
 *                 description: Current insulin on board
 *                 example: 2.5
 *               sleepLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Sleep level (1-3)
 *                 example: 1
 *               workLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Work level (1-3)
 *                 example: 2
 *               activityLevel:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Activity level (1-3)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Insulin prediction calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Prediction ID
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 cgmPrev:
 *                   type: array
 *                   items:
 *                     type: number
 *                 glucoseObjective:
 *                   type: number
 *                 carbs:
 *                   type: number
 *                 insulinOnBoard:
 *                   type: number
 *                 sleepLevel:
 *                   type: number
 *                 workLevel:
 *                   type: number
 *                 activityLevel:
 *                   type: number
 *                 recommendedDose:
 *                   type: number
 *                 applyDose:
 *                   type: number
 *                   nullable: true
 *                 cgmPost:
 *                   type: array
 *                   items:
 *                     type: number
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/calculate', calculateInsulinPrediction);

/**
 * @swagger
 * /api/insulin/predictions:
 *   get:
 *     summary: Obtener predicciones de insulina del usuario
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de predicciones de insulina
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InsulinPrediction'
 */
router.route('/predictions')
  .get(getInsulinPredictions)

/**
 * @swagger
 * /api/insulin/{id}:
 *   put:
 *     tags: [Insulin]
 *     summary: Update insulin prediction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applyDose
 *               - cgmPost
 *             properties:
 *               applyDose:
 *                 type: number
 *                 description: Applied insulin dose
 *               cgmPost:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Post-dose CGM values
 *     responses:
 *       200:
 *         description: Prediction updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags: [Insulin]
 *     summary: Delete insulin prediction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prediction ID
 *     responses:
 *       200:
 *         description: Prediction deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateInsulinPrediction);
router.delete('/:id', protect, deleteInsulinPrediction);

/**
 * @swagger
 * /api/insulin:
 *   get:
 *     tags: [Insulin]
 *     summary: Get all insulin predictions for the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of insulin predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   cgmPrev:
 *                     type: array
 *                     items:
 *                       type: number
 *                   glucoseObjective:
 *                     type: number
 *                   carbs:
 *                     type: number
 *                   insulinOnBoard:
 *                     type: number
 *                   sleepLevel:
 *                     type: number
 *                   workLevel:
 *                     type: number
 *                   activityLevel:
 *                     type: number
 *                   recommendedDose:
 *                     type: number
 *                   applyDose:
 *                     type: number
 *                     nullable: true
 *                   cgmPost:
 *                     type: array
 *                     items:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, getInsulinPredictions);

export default router;