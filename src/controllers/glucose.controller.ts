import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateGlucoseReadingInput } from '../models';

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

export const getGlucoseStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});