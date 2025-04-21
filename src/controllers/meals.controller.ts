import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { MealType } from '@prisma/client';

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
    include: {
      mealFoods: {
        include: {
          food: true
        }
      }
    }
  });
  
  res.json({
    success: true,
    data: meals
  });
});

interface FoodItem {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  servingSize: number;
  quantity: number;
}

export const createMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    description,
    type,
    foods,
    timestamp,
    photo
  }: {
    name: string;
    description?: string;
    type: MealType;
    foods: FoodItem[];
    timestamp?: string;
    photo?: string;
  } = req.body;

  if (!name || !type || !foods || !Array.isArray(foods) || foods.length === 0) {
    res.status(400).json({
      success: false,
      message: "Missing required fields or invalid foods array"
    });
    return;
  }

  try {
    const mealTimestamp = timestamp ? new Date(timestamp) : new Date();

    // Calculate meal totals from food items
    const totals = foods.reduce((acc, food) => ({
      carbs: acc.carbs + (food.carbs * food.quantity),
      protein: acc.protein + (food.protein * food.quantity),
      fat: acc.fat + (food.fat * food.quantity),
      calories: acc.calories + (food.calories * food.quantity)
    }), {
      carbs: 0,
      protein: 0,
      fat: 0,
      calories: 0
    });

    const meal = await prisma.meal.create({
      data: {
        name,
        description,
        type,
        ...totals,
        photo,
        timestamp: mealTimestamp,
        userId: req.user.id,
        mealFoods: {
          create: await Promise.all(foods.map(async food => {
            const createdFood = await prisma.food.create({
              data: {
                name: food.name,
                carbs: food.carbs,
                protein: food.protein,
                fat: food.fat,
                calories: food.calories,
                servingSize: food.servingSize
              }
            });
            return {
              quantity: food.quantity,
              foodId: createdFood.id
            };
          }))
        }
      },
      include: {
        mealFoods: {
          include: {
            food: true
          }
        }
      }
    });

    await prisma.activity.create({
      data: {
        type: 'meal',
        value: totals.calories,
        mealType: type,
        carbs: totals.carbs,
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

export const updateMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    name,
    description,
    type,
    foods,
    timestamp,
    photo
  }: {
    name?: string;
    description?: string;
    type?: MealType;
    foods?: FoodItem[];
    timestamp?: string;
    photo?: string;
  } = req.body;

  try {
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        mealFoods: true
      }
    });

    if (!existingMeal) {
      res.status(404).json({
        success: false,
        message: "Meal not found"
      });
      return;
    }

    let updateData: any = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(photo !== undefined && { photo }),
      ...(timestamp && { timestamp: new Date(timestamp) })
    };

    if (foods && Array.isArray(foods)) {
      // Calculate new totals
      const totals = foods.reduce((acc, food) => ({
        carbs: acc.carbs + (food.carbs * food.quantity),
        protein: acc.protein + (food.protein * food.quantity),
        fat: acc.fat + (food.fat * food.quantity),
        calories: acc.calories + (food.calories * food.quantity)
      }), {
        carbs: 0,
        protein: 0,
        fat: 0,
        calories: 0
      });

      updateData = {
        ...updateData,
        ...totals,
        mealFoods: {
          deleteMany: {},
          create: await Promise.all(foods.map(async food => {
            const createdFood = await prisma.food.create({
              data: {
                name: food.name,
                carbs: food.carbs,
                protein: food.protein,
                fat: food.fat,
                calories: food.calories,
                servingSize: food.servingSize
              }
            });
            return {
              quantity: food.quantity,
              foodId: createdFood.id
            };
          }))
        }
      };
    }

    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: updateData,
      include: {
        mealFoods: {
          include: {
            food: true
          }
        }
      }
    });

    // Update activity if meal type or nutritional info changed
    if (type !== undefined || (foods && Array.isArray(foods))) {
      await prisma.activity.updateMany({
        where: {
          type: 'meal',
          userId: req.user.id,
          timestamp: existingMeal.timestamp
        },
        data: {
          ...(type !== undefined && { mealType: type }),
          ...(foods !== undefined && { 
            value: updateData.calories,
            carbs: updateData.carbs
          })
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