import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';

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