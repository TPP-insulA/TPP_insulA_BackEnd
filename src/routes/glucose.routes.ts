import { Router } from 'express';
import {
  createGlucoseReading,
  getGlucoseReadings,
  updateGlucoseReading,
  deleteGlucoseReading,
  getGlucoseStats
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
 *         - timestamp
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

/**
 * @swagger
 * /api/glucose/stats:
 *   get:
 *     summary: Get glucose statistics
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for calculating stats
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for calculating stats
 *     responses:
 *       200:
 *         description: Glucose statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average:
 *                   type: number
 *                 max:
 *                   type: number
 *                 min:
 *                   type: number
 *                 readings:
 *                   type: number
 */
router.get('/stats', getGlucoseStats);

/**
 * @swagger
 * /api/glucose/{id}:
 *   put:
 *     summary: Update a glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the glucose reading
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Glucose reading updated successfully
 *   delete:
 *     summary: Delete a glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the glucose reading
 *     responses:
 *       200:
 *         description: Glucose reading deleted successfully
 */
router.put('/:id', updateGlucoseReading);
router.delete('/:id', deleteGlucoseReading);

export default router;