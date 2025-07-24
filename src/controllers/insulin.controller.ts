import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  InsulinPredictionData, 
} from '../models';
import { getModelPrediction } from '../utils/model.utils';


export const updateInsulinPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    applyDose,
    cgmPost,
  } = req.body;
  console.log('Updating insulin dose with ID:', id);
  console.log('Apply dose:', applyDose);
  console.log('CGM post:', cgmPost);
  
  const dose = await prisma.insulinPrediction.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!dose) {
    console.log('Dose not found for ID:', id);
    console.log('User ID:', req.user.id);
    res.status(404);
    throw new Error('Insulin dose not found');
  }
  
  const updatedDose = await prisma.insulinPrediction.update({
    where: { id },
    data: {
      applyDose,
      cgmPost,
    },
  });

  const responseData = {
    applyDose: updatedDose.applyDose,
    cgmPost: updatedDose.cgmPost,
  };
  console.log('Updated dose:', responseData);
  
  res.json(responseData);
});

export const deleteInsulinPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('Deleting insulin prediction with ID:', id);
  console.log('Deleting insulin prediction with user ID:', req.user.id);
  
  const dose = await prisma.insulinPrediction.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });
  
  if (!dose) {
    res.status(404);
    throw new Error('Insulin prediction not found');
  }
  
  // Delete insulin prediction and associated activity atomically
  await prisma.$transaction([
    prisma.activity.deleteMany({
      where: {
        sourceId: id,
        type: 'insulin',
        userId: req.user.id,
      },
    }),
    prisma.insulinPrediction.delete({
      where: { id },
    }),
  ]);
  
  res.json({ success: true });
});

export const calculateInsulinPrediction = asyncHandler(async (req: Request, res: Response) => {
  console.log('[calculateInsulinPrediction] Starting prediction calculation');
  console.log('[calculateInsulinPrediction] Request body:', JSON.stringify(req.body, null, 2));
  
  const { 
    date,
    cgmPrev,
    carbs,
    glucoseObjective,
    insulinOnBoard,
    sleepLevel,
    workLevel,
    activityLevel,
  }: InsulinPredictionData = req.body;
  
  try {
    console.log('[calculateInsulinPrediction] Preparing data for model prediction');
    console.log('[calculateInsulinPrediction] Input parameters:', {
      date,
      cgmPrevLength: cgmPrev.length,
      glucoseObjective,
      carbs,
      insulinOnBoard,
      sleepLevel,
      workLevel,
      activityLevel
    });

    // Get prediction from the DRL model
    console.log('[calculateInsulinPrediction] Calling model prediction');
    const prediction = await getModelPrediction({
      date,
      cgmPrev,
      glucoseObjective,
      carbs,
      insulinOnBoard,
      sleepLevel,
      workLevel,
      activityLevel,
    });
    
    console.log('[calculateInsulinPrediction] Model prediction received:', prediction);

    const data: any = {
      userId: req.user.id,
      date: date,
      cgmPrev: cgmPrev,
      carbs: carbs,
      recommendedDose: prediction.total,
      correctionDose: prediction.breakdown.correctionDose,
      mealDose: prediction.breakdown.mealDose,
      activityAdjustment: prediction.breakdown.activityAdjustment,
      timeAdjustment: prediction.breakdown.timeAdjustment,
      applyDose: null,
      cgmPost: []
    };

    // Add optional fields only if they are defined
    if (glucoseObjective !== undefined) {
      data.glucoseObjective = glucoseObjective;
    }
    if (insulinOnBoard !== undefined) {
      data.insulinOnBoard = insulinOnBoard;
    }
    if (sleepLevel !== undefined) {
      data.sleepLevel = sleepLevel;
    }
    if (workLevel !== undefined) {
      data.workLevel = workLevel;
    }
    if (activityLevel !== undefined) {
      data.activityLevel = activityLevel;
    }
    
    console.log('[calculateInsulinPrediction] Creating database records');
    // Create calculation record and associated activity atomically
    const result = await prisma.$transaction(async (tx) => {
      console.log('[calculateInsulinPrediction] Creating insulin prediction record');
      const insulinPrediction = await tx.insulinPrediction.create({
        data
      });
      console.log('[calculateInsulinPrediction] Creating activity record');
      const activity = await tx.activity.create({
        data: {
          type: 'insulin',
          value: prediction.total,
          timestamp: new Date(date),
          userId: req.user.id,
          sourceId: insulinPrediction.id,
        },
      });
      return { insulinPrediction, activity };
    });
    const predictionId = result.insulinPrediction.id;
    console.log('[calculateInsulinPrediction] Records created successfully. Prediction ID:', predictionId);

    // Remove userId from the response and add predictionId as id
    const responseData = {
      ...data,
      id: predictionId,
    };
    console.log('[calculateInsulinPrediction] Sending response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('[calculateInsulinPrediction] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    res.status(500);
    throw new Error('Failed to calculate insulin prediction');
  }
});

export const getInsulinPredictions = asyncHandler(async (req: Request, res: Response) => {
  const predictions = await prisma.insulinPrediction.findMany({
    where: { 
      userId: req.user.id,
    },
    orderBy: { date: 'desc' },
  });
  res.json(predictions);
});
