import { InsulinPredictionData } from '../models';

interface ModelPredictionResult {
  total: number;
  breakdown: {
    correctionDose: number;
    mealDose: number;
    activityAdjustment: number;
    timeAdjustment: number;
  };
}

// API request interface for the Python model service
interface ModelAPIRequest {
  date: string;
  cgm: number;
  carbs: number;
  insulinOnBoard?: number;
  cgm_history: number[];
  patient_name?: string;
}

// API response interface from the Python model service
interface ModelAPIResponse {
  total: number;
  breakdown: {
    correctionDose: number;
    mealDose: number;
    activityAdjustment: number;
    timeAdjustment: number;
  };
}

export const getModelPrediction = async (data: InsulinPredictionData): Promise<ModelPredictionResult> => {
  // Get the model API URL from environment variables, fallback to localhost
  const modelApiUrl = process.env.MODEL_API_URL || 'http://localhost:5000';
  
  // Get the current CGM value (last value in the history)
  const currentCgm = data.cgmPrev[0];
  
  // Prepare the request payload

  const requestPayload: ModelAPIRequest = {
    date: data.date,
    cgm: currentCgm,
    carbs: data.carbs,
    cgm_history: [...data.cgmPrev].reverse()
  };

  console.log('[getModelPrediction] Request payload:', JSON.stringify(requestPayload, null, 2));

  // Add optional insulinOnBoard if provided
  if (data.insulinOnBoard !== undefined && data.insulinOnBoard !== null) {
    requestPayload.insulinOnBoard = data.insulinOnBoard;
  }

  try {
    const response = await fetch(`${modelApiUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Model API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as ModelAPIResponse;
    
    return {
      total: result.total,
      breakdown: {
        correctionDose: result.breakdown.correctionDose,
        mealDose: result.breakdown.mealDose,
        activityAdjustment: result.breakdown.activityAdjustment,
        timeAdjustment: result.breakdown.timeAdjustment,
      }
    };
  } catch (error) {
    console.error('Error calling model prediction API:', error);
    throw new Error(`Failed to get model prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 