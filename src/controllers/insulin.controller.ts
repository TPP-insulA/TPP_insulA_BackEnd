import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateInsulinDoseInput } from '../models';

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
 *             properties:
 *               units:
 *                 type: number
 *                 description: Units of insulin administered
 *               glucoseLevel:
 *                 type: number
 *                 description: Current glucose level in mg/dL
 *               carbIntake:
 *                 type: number
 *                 description: Carbohydrates consumed in grams
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Insulin dose recorded successfully
 *       400:
 *         description: Invalid input data
 */
export const createInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { units, glucoseLevel, carbIntake }: CreateInsulinDoseInput = req.body;
  
  const dose = await prisma.insulinDose.create({
    data: {
      units,
      glucoseLevel,
      carbIntake,
      userId: req.user.id,
    },
  });
  
  // Also create an activity record for this insulin dose
  await prisma.activity.create({
    data: {
      type: 'insulin',
      value: glucoseLevel,
      carbs: carbIntake,
      units,
      timestamp: dose.timestamp,
      userId: req.user.id,
    },
  });
  
  res.status(201).json(dose);
});

/**
 * @swagger
 * /api/insulin:
 *   get:
 *     summary: Get user's insulin doses
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering doses
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering doses
 *     responses:
 *       200:
 *         description: List of insulin doses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   units:
 *                     type: number
 *                   glucoseLevel:
 *                     type: number
 *                   carbIntake:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 */
export const getInsulinDoses = asyncHandler(async (req: Request, res: Response) => {
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
  
  const doses = await prisma.insulinDose.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  
  res.json(doses);
});

/**
 * @swagger
 * /api/insulin/{id}:
 *   get:
 *     summary: Get a specific insulin dose
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Insulin dose ID
 *     responses:
 *       200:
 *         description: Insulin dose details
 *       404:
 *         description: Insulin dose not found
 */
export const getInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const dose = await prisma.insulinDose.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!dose) {
    res.status(404);
    throw new Error('Insulin dose not found');
  }
  
  res.json(dose);
});

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
 *         description: Insulin dose ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               units:
 *                 type: number
 *               glucoseLevel:
 *                 type: number
 *               carbIntake:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Insulin dose updated successfully
 *       404:
 *         description: Insulin dose not found
 */
export const updateInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { units, glucoseLevel, carbIntake } = req.body;
  
  const dose = await prisma.insulinDose.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!dose) {
    res.status(404);
    throw new Error('Insulin dose not found');
  }
  
  const updatedDose = await prisma.insulinDose.update({
    where: { id },
    data: {
      units: units !== undefined ? units : dose.units,
      glucoseLevel: glucoseLevel !== undefined ? glucoseLevel : dose.glucoseLevel,
      carbIntake: carbIntake !== undefined ? carbIntake : dose.carbIntake,
    },
  });
  
  // Also update the corresponding activity
  await prisma.activity.updateMany({
    where: {
      type: 'insulin',
      userId: req.user.id,
      timestamp: dose.timestamp,
    },
    data: {
      value: glucoseLevel !== undefined ? glucoseLevel : dose.glucoseLevel,
      carbs: carbIntake !== undefined ? carbIntake : dose.carbIntake,
      units: units !== undefined ? units : dose.units,
    },
  });
  
  res.json(updatedDose);
});

/**
 * @swagger
 * /api/insulin/{id}:
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
 *         description: Insulin dose ID
 *     responses:
 *       200:
 *         description: Insulin dose deleted successfully
 *       404:
 *         description: Insulin dose not found
 */
export const deleteInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const dose = await prisma.insulinDose.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!dose) {
    res.status(404);
    throw new Error('Insulin dose not found');
  }
  
  await prisma.$transaction([
    // Delete the insulin dose
    prisma.insulinDose.delete({
      where: { id },
    }),
    // Delete the corresponding activity
    prisma.activity.deleteMany({
      where: {
        type: 'insulin',
        userId: req.user.id,
        timestamp: dose.timestamp,
      },
    }),
  ]);
  
  res.json({ message: 'Insulin dose deleted' });
});

/**
 * @swagger
 * /api/insulin/stats:
 *   get:
 *     summary: Get insulin statistics
 *     tags: [Insulin]
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
 *         description: Insulin statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDoses:
 *                   type: number
 *                 totalUnits:
 *                   type: number
 *                 averageUnits:
 *                   type: number
 *                 maxDose:
 *                   type: number
 *                 minDose:
 *                   type: number
 */
export const getInsulinStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});