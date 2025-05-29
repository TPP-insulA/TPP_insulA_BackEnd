import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  InsulinPredictionData, 
} from '../models';
import { getLastDigit } from '../utils/string.utils';


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
  
  await prisma.insulinPrediction.delete({
    where: { id },
  });
  
  res.json({ success: true });
});

export const calculateInsulinPrediction = asyncHandler(async (req: Request, res: Response) => {
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
  
  //Calculo de insulina es aleatorio
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

export const getInsulinPredictions = asyncHandler(async (req: Request, res: Response) => {
  const predictions = await prisma.insulinPrediction.findMany({
    where: { 
      userId: req.user.id,
    },
    orderBy: { date: 'desc' },
  });
  res.json(predictions);
});
