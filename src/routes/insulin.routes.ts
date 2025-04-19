import { Router } from 'express';
import {
  createInsulinDose,
  getInsulinDoses,
  updateInsulinDose,
  deleteInsulinDose,
  getInsulinStats
} from '../controllers/insulin.controller';
import { protect } from '../middleware/auth.middleware';

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
 * /api/insulin/stats:
 *   get:
 *     summary: Get insulin usage statistics
 *     tags: [Insulin]
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
 *         description: Insulin statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUnits:
 *                   type: number
 *                 rapidUnits:
 *                   type: number
 *                 longUnits:
 *                   type: number
 *                 doses:
 *                   type: number
 */
router.get('/stats', protect, getInsulinStats);

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
router.delete('/:id', protect, deleteInsulinDose);

export default router;