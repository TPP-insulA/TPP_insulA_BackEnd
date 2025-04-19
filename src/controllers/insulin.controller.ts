import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateInsulinDoseInput } from '../models';

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

export const getInsulinStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});