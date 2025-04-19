import { Router } from 'express';
import {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  getActivityStats,
  getActivity
} from '../controllers/activity.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Physical activity tracking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - type
 *         - duration
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the activity
 *         type:
 *           type: string
 *           enum: [WALKING, RUNNING, CYCLING, SWIMMING, OTHER]
 *           description: Type of physical activity
 *         duration:
 *           type: number
 *           description: Duration in minutes
 *         intensity:
 *           type: string
 *           enum: [LOW, MODERATE, HIGH]
 *           description: Activity intensity level
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the activity was performed
 *         notes:
 *           type: string
 *           description: Optional notes about the activity
 *         userId:
 *           type: string
 *           description: ID of the user who performed the activity
 */

const router = Router();

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Record a new physical activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - duration
 *               - timestamp
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [WALKING, RUNNING, CYCLING, SWIMMING, OTHER]
 *               duration:
 *                 type: number
 *                 description: Duration in minutes
 *               intensity:
 *                 type: string
 *                 enum: [LOW, MODERATE, HIGH]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity recorded successfully
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering activities
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering activities
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [WALKING, RUNNING, CYCLING, SWIMMING, OTHER]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 */
router.post('/', protect, createActivity);
router.get('/', protect, getActivities);

/**
 * @swagger
 * /api/activities/stats:
 *   get:
 *     summary: Get activity statistics
 *     tags: [Activities]
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
 *         description: Activity statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMinutes:
 *                   type: number
 *                 totalActivities:
 *                   type: number
 *                 byType:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 */
router.get('/stats', protect, getActivityStats);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update an activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the activity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *   delete:
 *     summary: Delete an activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the activity
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 */
router.put('/:id', protect, updateActivity);
router.delete('/:id', protect, deleteActivity);
router.get('/:id', protect, getActivity);

export default router;