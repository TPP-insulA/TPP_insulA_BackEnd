import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { CreateActivityInput } from '../models';

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
        type: 'insulin',
        glucoseLevel: value,
        carbIntake: carbs,
        userId: req.user.id,
        timestamp: activity.timestamp,
      },
    });
  }
  
  res.status(201).json(activity);
});

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

export const getActivityStats = asyncHandler(async (req: Request, res: Response) => {
  // ...existing code...
});