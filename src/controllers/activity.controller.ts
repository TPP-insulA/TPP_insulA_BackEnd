import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateActivityInput } from '../models';

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Record a new activity
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
 *               - intensity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [exercise, walk, run, bike, swim, other]
 *               duration:
 *                 type: number
 *                 description: Duration in minutes
 *               intensity:
 *                 type: string
 *                 enum: [low, moderate, high]
 *               notes:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Activity recorded successfully
 *       400:
 *         description: Invalid input data
 */
export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const { type, value, mealType, carbs, units }: CreateActivityInput = req.body;
  
  // Validate based on activity type
  if (type === 'meal' && !mealType) {
    res.status(400);
    throw new Error('Meal type is required for meal activities');
  }
  
  if (type === 'meal' && !carbs) {
    res.status(400);
    throw new Error('Carbs value is required for meal activities');
  }
  
  if (type === 'insulin' && !units) {
    res.status(400);
    throw new Error('Units value is required for insulin activities');
  }
  
  const activity = await prisma.activity.create({
    data: {
      type,
      value,
      mealType,
      carbs,
      units,
      userId: req.user.id,
    },
  });
  
  // If this is an insulin dose, also create an insulin dose record
  if (type === 'insulin' && units) {
    await prisma.insulinDose.create({
      data: {
        units,
        glucoseLevel: value,
        carbIntake: carbs,
        userId: req.user.id,
        timestamp: activity.timestamp,
      },
    });
  }
  
  res.status(201).json(activity);
});

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get user's activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering activities
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering activities
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [exercise, walk, run, bike, swim, other]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   duration:
 *                     type: number
 *                   intensity:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 */
export const getActivities = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, type, limit = 100 } = req.query;
  
  const whereClause: any = { 
    userId: req.user.id 
  };
  
  // Add type filter if provided
  if (type) {
    whereClause.type = type;
  }
  
  // Add date filters if provided
  if (startDate || endDate) {
    whereClause.timestamp = {};
    
    if (startDate) {
      whereClause.timestamp.gte = new Date(startDate as string);
    }
    
    if (endDate) {
      whereClause.timestamp.lte = new Date(endDate as string);
    }
  }
  
  const activities = await prisma.activity.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  
  res.json(activities);
});

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get a specific activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *       404:
 *         description: Activity not found
 */
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }
  
  res.json(activity);
});

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
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [exercise, walk, run, bike, swim, other]
 *               duration:
 *                 type: number
 *               intensity:
 *                 type: string
 *                 enum: [low, moderate, high]
 *               notes:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 */
export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, value, mealType, carbs, units } = req.body;
  
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }
  
  const updatedActivity = await prisma.activity.update({
    where: { id },
    data: {
      type: type !== undefined ? type : activity.type,
      value: value !== undefined ? value : activity.value,
      mealType: mealType !== undefined ? mealType : activity.mealType,
      carbs: carbs !== undefined ? carbs : activity.carbs,
      units: units !== undefined ? units : activity.units,
    },
  });
  
  // If this is an insulin activity and units changed, update the corresponding insulin dose
  if (activity.type === 'insulin' && (units !== undefined || value !== undefined || carbs !== undefined)) {
    await prisma.insulinDose.updateMany({
      where: {
        userId: req.user.id,
        timestamp: activity.timestamp,
      },
      data: {
        units: units !== undefined ? units : activity.units,
        glucoseLevel: value !== undefined ? value : activity.value,
        carbIntake: carbs !== undefined ? carbs : activity.carbs,
      },
    });
  }
  
  res.json(updatedActivity);
});

/**
 * @swagger
 * /api/activities/{id}:
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
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 */
export const deleteActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }
  
  await prisma.$transaction([
    // Delete the activity
    prisma.activity.delete({
      where: { id },
    }),
    // If this was an insulin activity, also delete the corresponding insulin dose
    ...(activity.type === 'insulin'
      ? [
          prisma.insulinDose.deleteMany({
            where: {
              userId: req.user.id,
              timestamp: activity.timestamp,
            },
          }),
        ]
      : []),
  ]);
  
  res.json({ message: 'Activity deleted' });
});

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
 *           format: date-time
 *         description: Start date for calculating statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for calculating statistics
 *     responses:
 *       200:
 *         description: Activity statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActivities:
 *                   type: number
 *                 totalDuration:
 *                   type: number
 *                 activitiesByType:
 *                   type: object
 *                 averageDuration:
 *                   type: number
 */
export const getActivityStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});