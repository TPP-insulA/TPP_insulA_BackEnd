"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelPrediction = void 0;
const getModelPrediction = async (data) => {
    const modelApiUrl = process.env.MODEL_API_URL || 'http://localhost:5000';
    const currentCgm = data.cgmPrev[0];
    const requestPayload = {
        date: data.date,
        cgm: currentCgm,
        carbs: data.carbs,
        cgm_history: [...data.cgmPrev].reverse()
    };
    console.log('[getModelPrediction] Request payload:', JSON.stringify(requestPayload, null, 2));
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
        const result = await response.json();
        return {
            total: result.total,
            breakdown: {
                correctionDose: result.breakdown.correctionDose,
                mealDose: result.breakdown.mealDose,
                activityAdjustment: result.breakdown.activityAdjustment,
                timeAdjustment: result.breakdown.timeAdjustment,
            }
        };
    }
    catch (error) {
        console.error('Error calling model prediction API:', error);
        throw new Error(`Failed to get model prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.getModelPrediction = getModelPrediction;
//# sourceMappingURL=model.utils.js.map