import { Router } from 'express';
import {
  getActivities,
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
router.get('/', protect, getActivities);

export default router;