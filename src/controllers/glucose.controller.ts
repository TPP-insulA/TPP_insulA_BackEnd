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

export const createGlucoseReading = asyncHandler(async (req: Request, res: Response) => {
  const { value, notes, date }: CreateGlucoseReadingInput = req.body;

  const user = await prisma.user.findFirst({
    where: { id: req.user.id },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const target = {
    minTarget: user.minTargetGlucose || 70, // Default to 70 if not set
    maxTarget: user.maxTargetGlucose || 180, // Default to 180 if not set
  }
  
  // Create glucose reading and associated activity atomically
  const result = await prisma.$transaction(async (tx) => {
    const reading = await tx.glucoseReading.create({
      data: {
        value,
        timestamp: date ? new Date(date) : new Date(),
        notes,
        userId: req.user.id,
      },
    });
    const activity = await tx.activity.create({
      data: {
        type: 'glucose',
        value,
        notes,
        timestamp: reading.timestamp,
        userId: req.user.id,
        sourceId: reading.id,
      },
    });
    return { reading, activity };
  });
  const reading = result.reading;
  
  // Return the reading with status information based on the target range
  let status = 'in-range';
  if (value < target.minTarget) status = 'low';
  if (value > target.maxTarget) status = 'high';
  
  res.status(201).json({
    ...reading,
    status,
  });
});

