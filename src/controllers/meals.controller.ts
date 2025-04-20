import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';

export const getMeals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, limit = 100 } = req.query;
  
  const whereClause: any = { 
    userId: req.user.id 
  };
  
  if (startDate || endDate) {
    whereClause.timestamp = {};
    
    if (startDate) {
      whereClause.timestamp.gte = new Date(startDate as string);
    }
    
    if (endDate) {
      whereClause.timestamp.lte = new Date(endDate as string);
    }
  }
  
  const meals = await prisma.meal.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  
  res.json({
    success: true,
    data: meals
  });
});

export const createMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    description,
    carbs,
    protein,
    fat,
    calories,
    quantity = 1,
    timestamp,
    photo
  } = req.body;

  if (
    !name || 
    carbs === undefined || carbs === null ||
    protein === undefined || protein === null ||
    fat === undefined || fat === null ||
    calories === undefined || calories === null
  ) {
    res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
    return;
  }

  try {
    const mealTimestamp = timestamp ? new Date(timestamp) : new Date();

    const meal = await prisma.meal.create({
      data: {
        name,
        description,
        carbs,
        protein,
        fat,
        calories,
        quantity,
        photo,
        timestamp: mealTimestamp,
        userId: req.user.id
      }
    });

    await prisma.activity.create({
      data: {
        type: 'meal',
        value: calories,
        mealType: 'other',
        carbs,
        timestamp: mealTimestamp,
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: meal
    });
  } catch (error: any) {
    console.error('Error creating meal:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create meal"
    });
  }
});

export const deleteMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const meal = await prisma.meal.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!meal) {
      res.status(404).json({
        success: false,
        message: "Meal not found"
      });
      return;
    }

    await prisma.$transaction([
      prisma.meal.delete({
        where: { id }
      }),
      prisma.activity.deleteMany({
        where: {
          type: 'meal',
          userId: req.user.id,
          timestamp: meal.timestamp
        }
      })
    ]);

    res.json({
      success: true,
      message: "Meal deleted successfully"
    });
  } catch (error: any) {
    console.error('Error deleting meal:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete meal"
    });
  }
});

export const updateMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    name,
    description,
    carbs,
    protein,
    fat,
    calories,
    quantity,
    timestamp,
    photo
  } = req.body;

  try {
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingMeal) {
      res.status(404).json({
        success: false,
        message: "Meal not found"
      });
      return;
    }

    if (
      (name !== undefined && !name) ||
      (carbs !== undefined && (carbs === null)) ||
      (protein !== undefined && (protein === null)) ||
      (fat !== undefined && (fat === null)) ||
      (calories !== undefined && (calories === null))
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
      return;
    }

    const mealTimestamp = timestamp ? new Date(timestamp) : undefined;

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(carbs !== undefined && { carbs }),
        ...(protein !== undefined && { protein }),
        ...(fat !== undefined && { fat }),
        ...(calories !== undefined && { calories }),
        ...(quantity !== undefined && { quantity }),
        ...(photo !== undefined && { photo }),
        ...(mealTimestamp && { timestamp: mealTimestamp })
      }
    });

    if (calories !== undefined || carbs !== undefined) {
      await prisma.activity.updateMany({
        where: {
          type: 'meal',
          userId: req.user.id,
          timestamp: existingMeal.timestamp
        },
        data: {
          ...(calories !== undefined && { value: calories }),
          ...(carbs !== undefined && { carbs })
        }
      });
    }

    res.json({
      success: true,
      data: updatedMeal
    });
  } catch (error: any) {
    console.error('Error updating meal:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update meal"
    });
  }
});