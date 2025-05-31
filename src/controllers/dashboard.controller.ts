import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';

export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  // Parse startDate and endDate from query
  const { startDate, endDate } = req.query;

  // Build where clause for glucose readings
  const glucoseWhere: any = { userId: req.user.id };
  if (startDate || endDate) {
    glucoseWhere.timestamp = {};
    if (startDate) glucoseWhere.timestamp.gte = new Date(startDate as string);
    if (endDate) glucoseWhere.timestamp.lte = new Date(endDate as string);
  }

  // Get glucose readings (filtered by date if provided)
  const glucoseReadings = await prisma.glucoseReading.findMany({
    where: glucoseWhere,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  // Get activities
  const activities = await prisma.activity.findMany({
    where: { userId: req.user.id },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Get insulin prediction history
  const predictionHistory = await prisma.insulinPrediction.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' },
  });

  res.json({
    glucoseReadings,
    userProfile: user,
    activities,
    predictions: predictionHistory,
  });
});
