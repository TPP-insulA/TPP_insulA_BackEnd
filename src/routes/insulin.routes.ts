import { Router } from 'express';
import {
  createInsulinDose,
  getInsulinDoses,
  updateInsulinDose,
  deleteInsulinPrediction,
  calculateInsulinDose,
  getInsulinPredictions,
  logPredictionResult,
  getInsulinSettings,
  updateInsulinSettings
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
 *     InsulinDose:
 *       type: object
 *       required:
 *         - units
 *         - timestamp
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the dose
 *         units:
 *           type: number
 *           description: Number of insulin units
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the dose was administered
 *         type:
 *           type: string
 *           enum: [RAPID, LONG]
 *           description: Type of insulin
 *         notes:
 *           type: string
 *           description: Optional notes about the dose
 *         userId:
 *           type: string
 *           description: ID of the user who took the dose
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
 * /api/insulin/doses:
 *   get:
 *     summary: Get user's insulin doses with optional date range
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering doses
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering doses
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of doses to return
 *     responses:
 *       200:
 *         description: List of insulin doses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 doses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: 
 *                         type: string
 *                       units:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [rapid, long]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       notes:
 *                         type: string
 *   post:
 *     summary: Add new insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - units
 *               - type
 *             properties:
 *               units:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [rapid, long]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Insulin dose created
 */
router.route('/doses')
  .get(getInsulinDoses)
  .post(createInsulinDose);

/**
 * @swagger
 * /api/insulin/calculate:
 *   post:
 *     summary: Calculate recommended insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentGlucose
 *               - carbs
 *               - activity
 *               - timeOfDay
 *             properties:
 *               currentGlucose:
 *                 type: number
 *               carbs:
 *                 type: number
 *               activity:
 *                 type: string
 *               timeOfDay:
 *                 type: string
 *     responses:
 *       200:
 *         description: Calculated insulin dose
 */
router.post('/calculate', calculateInsulinDose);

/**
 * @swagger
 * /api/insulin/predictions:
 *   get:
 *     summary: Get recent predictions and accuracy
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of predictions with accuracy metrics
 *   post:
 *     summary: Log prediction result for accuracy tracking
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mealType
 *               - carbs
 *               - glucose
 *               - units
 *               - resultingGlucose
 *             properties:
 *               mealType:
 *                 type: string
 *               carbs:
 *                 type: number
 *               glucose:
 *                 type: number
 *               units:
 *                 type: number
 *               resultingGlucose:
 *                 type: number
 *     responses:
 *       201:
 *         description: Prediction logged successfully
 */
router.route('/predictions')
  .get(getInsulinPredictions)
  .post(logPredictionResult);

/**
 * @swagger
 * /api/insulin/settings:
 *   get:
 *     summary: Get user's insulin calculation settings
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's insulin settings
 *   put:
 *     summary: Update user's insulin calculation settings
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carbRatio:
 *                 type: number
 *               correctionFactor:
 *                 type: number
 *               targetGlucose:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               activeInsulin:
 *                 type: object
 *                 properties:
 *                   duration:
 *                     type: number
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.route('/settings')
  .get(getInsulinSettings)
  .put(updateInsulinSettings);

/**
 * @swagger
 * /api/insulin:
 *   post:
 *     summary: Record a new insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - units
 *               - timestamp
 *               - type
 *             properties:
 *               units:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [RAPID, LONG]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Insulin dose recorded successfully
 *   get:
 *     summary: Get all insulin doses
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering doses
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering doses
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [RAPID, LONG]
 *         description: Filter by insulin type
 *     responses:
 *       200:
 *         description: List of insulin doses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InsulinDose'
 */
router.post('/', protect, createInsulinDose);
router.get('/', protect, getInsulinDoses);

/**
 * @swagger
 * /api/insulin/{id}:
 *   put:
 *     summary: Update an insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the insulin dose
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsulinDose'
 *     responses:
 *       200:
 *         description: Insulin dose updated successfully
 *   delete:
 *     summary: Delete an insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the insulin dose
 *     responses:
 *       200:
 *         description: Insulin dose deleted successfully
 */
router.put('/:id', protect, updateInsulinDose);
router.delete('/:id', protect, deleteInsulinPrediction);

export default router;