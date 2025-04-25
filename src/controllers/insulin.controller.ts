import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  CreateInsulinDoseInput, 
  InsulinCalculationInput, 
  InsulinPredictionInput,
  InsulinSettingsInput,
  InsulinType,
  AccuracyType
} from '../models';

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
    prisma.insulinDose.delete({
      where: { id },
    }),
    prisma.activity.deleteMany({
      where: {
        type: 'insulin',
        userId: req.user.id,
        timestamp: dose.timestamp,
      },
    }),
  ]);
  
  res.json({ success: true });
});

export const calculateInsulinDose = asyncHandler(async (req: Request, res: Response) => {
  const { currentGlucose, carbs, activity, timeOfDay }: InsulinCalculationInput = req.body;

  // Get user's insulin settings
  const settings = await prisma.insulinSettings.findUnique({
    where: { userId: req.user.id }
  });

  if (!settings) {
    res.status(400);
    throw new Error('Insulin settings not configured');
  }

  // Calculate correction dose
  const correctionDose = (currentGlucose - settings.targetGlucoseMin) / settings.correctionFactor;
  
  // Calculate meal dose
  const mealDose = carbs / settings.carbRatio;
  
  // Calculate activity adjustment (simplified example)
  const activityAdjustment = activity === 'high' ? -0.2 : 
                            activity === 'moderate' ? -0.1 : 0;
  
  // Calculate time adjustment (simplified example)
  const timeAdjustment = timeOfDay === 'dawn' ? 0.1 : 
                        timeOfDay === 'evening' ? -0.1 : 0;
  
  // Calculate total dose
  const total = Math.max(0, 
    (correctionDose + mealDose) * 
    (1 + activityAdjustment + timeAdjustment)
  );

  // Create calculation record
  await prisma.insulinCalculation.create({
    data: {
      userId: req.user.id,
      currentGlucose,
      carbs,
      activity,
      timeOfDay,
      total,
      correctionDose,
      mealDose,
      activityAdjustment,
      timeAdjustment
    }
  });

  res.json({
    total: Math.round(total * 10) / 10,
    breakdown: {
      correctionDose: Math.round(correctionDose * 10) / 10,
      mealDose: Math.round(mealDose * 10) / 10,
      activityAdjustment: Math.round(activityAdjustment * 100) / 100,
      timeAdjustment: Math.round(timeAdjustment * 100) / 100
    }
  });
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
  const { limit = 10 } = req.query;

  const predictions = await prisma.insulinCalculation.findMany({
    where: { 
      userId: req.user.id,
      resultingGlucose: { not: null },
      accuracy: { not: null }
    },
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
    select: {
      id: true,
      accuracy: true,
      timestamp: true,
      timeOfDay: true,
      carbs: true,
      currentGlucose: true,
      total: true
    }
  }) as PredictionData[];

  // Calculate accuracy percentage
  const accurateCount = predictions.filter(p => p.accuracy === 'Accurate').length;
  const accuracyPercentage = predictions.length > 0 
    ? (accurateCount / predictions.length) * 100 
    : 0;

  // Calculate trend
  const previousAccuracies = predictions.map(p => p.accuracy === 'Accurate' ? 1 : 0);
  const trend = previousAccuracies.length > 1
    ? (previousAccuracies[0] - previousAccuracies[previousAccuracies.length - 1])
    : 0;

  res.json({
    accuracy: {
      percentage: Math.round(accuracyPercentage * 10) / 10,
      trend: {
        value: Math.abs(trend) * 100,
        direction: trend >= 0 ? 'up' : 'down'
      }
    },
    predictions: predictions.map(p => ({
      id: p.id,
      mealType: p.timeOfDay,
      date: p.timestamp,
      carbs: p.carbs,
      glucose: p.currentGlucose,
      units: p.total,
      accuracy: p.accuracy
    }))
  });
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