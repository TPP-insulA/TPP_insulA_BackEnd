import { Router } from 'express';
import {
  createGlucoseReading,
  getGlucoseReadings,
} from '../controllers/glucose.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Glucose
 *   description: Glucose readings management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GlucoseReading:
 *       type: object
 *       required:
 *         - value
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the reading
 *         value:
 *           type: number
 *           description: Glucose level value
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the reading was taken
 *         notes:
 *           type: string
 *           description: Optional notes about the reading
 *         userId:
 *           type: string
 *           description: ID of the user who took the reading
 *         status:
 *           type: string
 *           enum: [low, in-range, high]
 *           description: Status of the reading based on user target (returned in response)
 */

/**
 * @swagger
 * /api/glucose:
 *   post:
 *     summary: Crear una nueva medición de glucosa
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *                 description: Glucose level value
 *               notes:
 *                 type: string
 *                 description: Optional notes about the reading
 *     responses:
 *       201:
 *         description: Glucose reading created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/GlucoseReading'
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Obtener todas las mediciones de glucosa del usuario
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering readings
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering readings
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of readings to return
 *     responses:
 *       200:
 *         description: List of glucose readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GlucoseReading'
 */

const router = Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/glucose:
 *   post:
 *     summary: Create a new glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - timestamp
 *             properties:
 *               value:
 *                 type: number
 *                 description: Glucose level value
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: When the reading was taken
 *               notes:
 *                 type: string
 *                 description: Optional notes about the reading
 *     responses:
 *       201:
 *         description: Glucose reading created successfully
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Get all glucose readings
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering readings
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering readings
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of readings to return
 *     responses:
 *       200:
 *         description: List of glucose readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GlucoseReading'
 */
router.post('/', createGlucoseReading);
router.get('/', getGlucoseReadings);

export default router;