"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsulinPredictions = exports.calculateInsulinPrediction = exports.deleteInsulinPrediction = exports.updateInsulinPrediction = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
const model_utils_1 = require("../utils/model.utils");
exports.updateInsulinPrediction = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { applyDose, cgmPost, } = req.body;
    console.log('Updating insulin dose with ID:', id);
    console.log('Apply dose:', applyDose);
    console.log('CGM post:', cgmPost);
    const dose = await app_1.prisma.insulinPrediction.findFirst({
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
    const updatedDose = await app_1.prisma.insulinPrediction.update({
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
exports.deleteInsulinPrediction = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    console.log('Deleting insulin prediction with ID:', id);
    console.log('Deleting insulin prediction with user ID:', req.user.id);
    const dose = await app_1.prisma.insulinPrediction.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!dose) {
        res.status(404);
        throw new Error('Insulin prediction not found');
    }
    await app_1.prisma.$transaction([
        app_1.prisma.activity.deleteMany({
            where: {
                sourceId: id,
                type: 'insulin',
                userId: req.user.id,
            },
        }),
        app_1.prisma.insulinPrediction.delete({
            where: { id },
        }),
    ]);
    res.json({ success: true });
});
exports.calculateInsulinPrediction = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[calculateInsulinPrediction] Starting prediction calculation');
    console.log('[calculateInsulinPrediction] Request body:', JSON.stringify(req.body, null, 2));
    const { date, cgmPrev, carbs, glucoseObjective, insulinOnBoard, sleepLevel, workLevel, activityLevel, } = req.body;
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
        console.log('[calculateInsulinPrediction] Calling model prediction');
        const prediction = await (0, model_utils_1.getModelPrediction)({
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
        const data = {
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
        const result = await app_1.prisma.$transaction(async (tx) => {
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
        const responseData = Object.assign(Object.assign({}, data), { id: predictionId });
        console.log('[calculateInsulinPrediction] Sending response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
    }
    catch (error) {
        console.error('[calculateInsulinPrediction] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
        });
        res.status(500);
        throw new Error('Failed to calculate insulin prediction');
    }
});
exports.getInsulinPredictions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const predictions = await app_1.prisma.insulinPrediction.findMany({
        where: {
            userId: req.user.id,
        },
        orderBy: { date: 'desc' },
    });
    res.json(predictions);
});
//# sourceMappingURL=insulin.controller.js.map