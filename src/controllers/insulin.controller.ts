import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  CreateInsulinDoseInput, 
  InsulinPredictionData, 
  InsulinPredictionInput,
  InsulinSettingsInput,
  InsulinType,
  AccuracyType
} from '../models';
import { getLastDigit } from '../utils/string.utils';

export const createInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { units, type, timestamp, notes }: CreateInsulinDoseInput = req.body;
  
  const dose = await prisma.insulinDose.create({
    data: {
      units,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      notes,
      userId: req.user.id,
    },
  });
  
  // Also create an activity record for this insulin dose
  await prisma.activity.create({
    data: {
      type: 'insulin',
      value: units,
      notes,
      timestamp: dose.timestamp,
      userId: req.user.id,
    },
  });
  
  res.status(201).json(dose);
});

export const getInsulinDoses = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, limit = 10 } = req.query;
  
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
  
  const doses = await prisma.insulinDose.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  
  res.json({ doses });
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
  
  await prisma.insulinPrediction.delete({
    where: { id },
  });
  
  res.json({ success: true });
});

export const calculateInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { 
    date,
    cgmPrev,
    glucoseObjective,
    carbs,
    insulinOnBoard,
    sleepLevel,
    workLevel,
    activityLevel,
  }: InsulinPredictionData = req.body;
  
  const randomNumber = String(Math.random());
  //ultimo digito de random number
  const recommendedDose = Number(getLastDigit(randomNumber)) || 1;
  console.log('Recommended dose:', recommendedDose);

  const data = {
    userId: req.user.id,
    date: new Date(date),
    cgmPrev: cgmPrev,
    glucoseObjective: glucoseObjective,
    carbs: carbs,
    insulinOnBoard: insulinOnBoard,
    sleepLevel: sleepLevel,
    workLevel: workLevel,
    activityLevel: activityLevel,
    recommendedDose: recommendedDose,
    applyDose: null,
    cgmPost: []
  };
  
  // Create calculation record
  const prismaResult = await prisma.insulinPrediction.create({
    data
  });
  const predictionId = prismaResult.id;

  await prisma.activity.create({
    data: {
      type: 'insulin',
      value: recommendedDose,
      timestamp: new Date(date),
      userId: req.user.id,
    },
  });
  // Remove userId from the response and add predictionId as id
  const responseData = {
    ...data,
    id: predictionId,
  };
  res.json(responseData);
});

interface PredictionData {
  id: string;
  accuracy: AccuracyType;
  timestamp: Date;
  timeOfDay: string;
  carbs: number;
  currentGlucose: number;
  total: number;
}

export const getInsulinPredictions = asyncHandler(async (req: Request, res: Response) => {
  const predictions = await prisma.insulinPrediction.findMany({
    where: { 
      userId: req.user.id,
    },
    orderBy: { date: 'desc' },
  });
  res.json(predictions);
});

export const logPredictionResult = asyncHandler(async (req: Request, res: Response) => {
  const { mealType, carbs, glucose, units, resultingGlucose }: InsulinPredictionInput = req.body;

  // Get user's insulin settings
  const settings = await prisma.insulinSettings.findUnique({
    where: { userId: req.user.id }
  });

  if (!settings) {
    res.status(400);
    throw new Error('Insulin settings not configured');
  }

  // Determine accuracy based on resulting glucose
  let accuracy: AccuracyType;
  if (resultingGlucose >= settings.targetGlucoseMin && resultingGlucose <= settings.targetGlucoseMax) {
    accuracy = 'Accurate';
  } else if (resultingGlucose < settings.targetGlucoseMin) {
    accuracy = resultingGlucose < settings.targetGlucoseMin - 30 ? 'Low' : 'Slightly low';
  } else {
    accuracy = 'Slightly low'; // High glucose is considered slightly low insulin
  }

  const prediction = await prisma.insulinCalculation.create({
    data: {
      userId: req.user.id,
      currentGlucose: glucose,
      carbs,
      activity: 'none',
      timeOfDay: mealType,
      total: units,
      correctionDose: 0,
      mealDose: units,
      activityAdjustment: 0,
      timeAdjustment: 0,
      resultingGlucose,
      accuracy
    }
  });

  res.status(201).json({
    id: prediction.id,
    accuracy
  });
});

export const getInsulinSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await prisma.insulinSettings.findUnique({
    where: { userId: req.user.id }
  });

  if (!settings) {
    res.status(404);
    throw new Error('Insulin settings not found');
  }

  res.json({
    carbRatio: settings.carbRatio,
    correctionFactor: settings.correctionFactor,
    targetGlucose: {
      min: settings.targetGlucoseMin,
      max: settings.targetGlucoseMax
    },
    activeInsulin: {
      duration: settings.activeInsulinDuration
    }
  });
});

export const updateInsulinSettings = asyncHandler(async (req: Request, res: Response) => {
  const { carbRatio, correctionFactor, targetGlucose, activeInsulin }: InsulinSettingsInput = req.body;

  const settings = await prisma.insulinSettings.upsert({
    where: { userId: req.user.id },
    update: {
      ...(carbRatio !== undefined && { carbRatio }),
      ...(correctionFactor !== undefined && { correctionFactor }),
      ...(targetGlucose?.min !== undefined && { targetGlucoseMin: targetGlucose.min }),
      ...(targetGlucose?.max !== undefined && { targetGlucoseMax: targetGlucose.max }),
      ...(activeInsulin?.duration !== undefined && { activeInsulinDuration: activeInsulin.duration })
    },
    create: {
      userId: req.user.id,
      carbRatio: carbRatio || 15,
      correctionFactor: correctionFactor || 50,
      targetGlucoseMin: targetGlucose?.min || 80,
      targetGlucoseMax: targetGlucose?.max || 140,
      activeInsulinDuration: activeInsulin?.duration || 4
    }
  });

  res.json({ success: true });
});