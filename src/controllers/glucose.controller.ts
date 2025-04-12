import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateGlucoseReadingInput } from '../models';

/**
 * @swagger
 * /api/glucose:
 *   get:
 *     summary: Get user's glucose readings
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering readings
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering readings
 *     responses:
 *       200:
 *         description: List of glucose readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   value:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 */
export const getGlucoseReadings = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, limit = 100 } = req.query;
  
  const whereClause: any = { 
    userId: req.user.id
  };
  
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
  
  const readings = await prisma.glucoseReading.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  
  res.json(readings);
});

/**
 * Get a single glucose reading by id
 * @route GET /api/glucose/:id
 * @access Private
 */
export const getGlucoseReading = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const reading = await prisma.glucoseReading.findFirst({
    where: { 
      id, 
      userId: req.user.id 
    },
  });
  
  if (!reading) {
    res.status(404);
    throw new Error('Glucose reading not found');
  }
  
  res.json(reading);
});

/**
 * @swagger
 * /api/glucose:
 *   post:
 *     summary: Add a new glucose reading
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
 *                 description: Glucose reading value in mg/dL
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Glucose reading created successfully
 *       400:
 *         description: Invalid input data
 */
export const createGlucoseReading = asyncHandler(async (req: Request, res: Response) => {
  const { value, notes }: CreateGlucoseReadingInput = req.body;
  
  // Get the user's target range
  const target = await prisma.glucoseTarget.findUnique({
    where: { userId: req.user.id },
  });
  
  const reading = await prisma.glucoseReading.create({
    data: {
      value,
      notes,
      userId: req.user.id,
    },
  });
  
  // Also create an activity record for this reading
  await prisma.activity.create({
    data: {
      type: 'glucose',
      value,
      timestamp: reading.timestamp,
      userId: req.user.id,
    },
  });
  
  // Return the reading with status information based on the target range
  let status = 'in-range';
  if (target) {
    if (value < target.minTarget) status = 'low';
    if (value > target.maxTarget) status = 'high';
  }
  
  res.status(201).json({
    ...reading,
    status,
  });
});

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
 *       404:
 *         description: Glucose reading not found
 */
export const updateGlucoseReading = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { value, notes } = req.body;
  
  const reading = await prisma.glucoseReading.findFirst({
    where: { 
      id, 
      userId: req.user.id 
    },
  });
  
  if (!reading) {
    res.status(404);
    throw new Error('Glucose reading not found');
  }
  
  const updatedReading = await prisma.glucoseReading.update({
    where: { id },
    data: {
      value: value !== undefined ? value : reading.value,
      notes: notes !== undefined ? notes : reading.notes,
    },
  });
  
  // If value was updated, also update the corresponding activity
  if (value !== undefined && value !== reading.value) {
    await prisma.activity.updateMany({
      where: {
        type: 'glucose',
        userId: req.user.id,
        timestamp: reading.timestamp,
      },
      data: {
        value,
      },
    });
  }
  
  res.json(updatedReading);
});

/**
 * @swagger
 * /api/glucose/{id}:
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
 *       404:
 *         description: Glucose reading not found
 */
export const deleteGlucoseReading = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const reading = await prisma.glucoseReading.findFirst({
    where: { 
      id, 
      userId: req.user.id 
    },
  });
  
  if (!reading) {
    res.status(404);
    throw new Error('Glucose reading not found');
  }
  
  await prisma.$transaction([
    // Delete the glucose reading
    prisma.glucoseReading.delete({
      where: { id },
    }),
    // Delete the corresponding activity
    prisma.activity.deleteMany({
      where: {
        type: 'glucose',
        userId: req.user.id,
        timestamp: reading.timestamp,
      },
    }),
  ]);
  
  res.json({ message: 'Glucose reading deleted' });
});

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
 *         description: Glucose statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageGlucose:
 *                   type: number
 *                 highReadings:
 *                   type: number
 *                 lowReadings:
 *                   type: number
 *                 inRangeReadings:
 *                   type: number
 *                 totalReadings:
 *                   type: number
 */
export const getGlucoseStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});