"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInsulinSettings = exports.getInsulinSettings = exports.logPredictionResult = exports.getInsulinPredictions = exports.calculateInsulinDose = exports.deleteInsulinDose = exports.updateInsulinDose = exports.getInsulinDose = exports.getInsulinDoses = exports.createInsulinDose = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.createInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { units, type, timestamp, notes } = req.body;
    const dose = await app_1.prisma.insulinDose.create({
        data: {
            units,
            type,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            notes,
            userId: req.user.id,
        },
    });
    await app_1.prisma.activity.create({
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
exports.getInsulinDoses = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, limit = 10 } = req.query;
    const whereClause = {
        userId: req.user.id
    };
    if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
            whereClause.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
            whereClause.timestamp.lte = new Date(endDate);
        }
    }
    const doses = await app_1.prisma.insulinDose.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json({ doses });
});
exports.getInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dose = await app_1.prisma.insulinDose.findFirst({
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
exports.updateInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { units, glucoseLevel, carbIntake } = req.body;
    const dose = await app_1.prisma.insulinDose.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!dose) {
        res.status(404);
        throw new Error('Insulin dose not found');
    }
    const updatedDose = await app_1.prisma.insulinDose.update({
        where: { id },
        data: {
            units: units !== undefined ? units : dose.units,
            glucoseLevel: glucoseLevel !== undefined ? glucoseLevel : dose.glucoseLevel,
            carbIntake: carbIntake !== undefined ? carbIntake : dose.carbIntake,
        },
    });
    await app_1.prisma.activity.updateMany({
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
exports.deleteInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const dose = await app_1.prisma.insulinDose.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!dose) {
        res.status(404);
        throw new Error('Insulin dose not found');
    }
    await app_1.prisma.$transaction([
        app_1.prisma.insulinDose.delete({
            where: { id },
        }),
        app_1.prisma.activity.deleteMany({
            where: {
                type: 'insulin',
                userId: req.user.id,
                timestamp: dose.timestamp,
            },
        }),
    ]);
    res.json({ success: true });
});
exports.calculateInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { currentGlucose, carbs, activity, timeOfDay } = req.body;
    const settings = await app_1.prisma.insulinSettings.findUnique({
        where: { userId: req.user.id }
    });
    if (!settings) {
        res.status(400);
        throw new Error('Insulin settings not configured');
    }
    const correctionDose = (currentGlucose - settings.targetGlucoseMin) / settings.correctionFactor;
    const mealDose = carbs / settings.carbRatio;
    const activityAdjustment = activity === 'high' ? -0.2 :
        activity === 'moderate' ? -0.1 : 0;
    const timeAdjustment = timeOfDay === 'dawn' ? 0.1 :
        timeOfDay === 'evening' ? -0.1 : 0;
    const total = Math.max(0, (correctionDose + mealDose) *
        (1 + activityAdjustment + timeAdjustment));
    await app_1.prisma.insulinCalculation.create({
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
exports.getInsulinPredictions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { limit = 10 } = req.query;
    const predictions = await app_1.prisma.insulinCalculation.findMany({
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
    });
    const accurateCount = predictions.filter(p => p.accuracy === 'Accurate').length;
    const accuracyPercentage = predictions.length > 0
        ? (accurateCount / predictions.length) * 100
        : 0;
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
exports.logPredictionResult = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { mealType, carbs, glucose, units, resultingGlucose } = req.body;
    const settings = await app_1.prisma.insulinSettings.findUnique({
        where: { userId: req.user.id }
    });
    if (!settings) {
        res.status(400);
        throw new Error('Insulin settings not configured');
    }
    let accuracy;
    if (resultingGlucose >= settings.targetGlucoseMin && resultingGlucose <= settings.targetGlucoseMax) {
        accuracy = 'Accurate';
    }
    else if (resultingGlucose < settings.targetGlucoseMin) {
        accuracy = resultingGlucose < settings.targetGlucoseMin - 30 ? 'Low' : 'Slightly low';
    }
    else {
        accuracy = 'Slightly low';
    }
    const prediction = await app_1.prisma.insulinCalculation.create({
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
exports.getInsulinSettings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const settings = await app_1.prisma.insulinSettings.findUnique({
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
exports.updateInsulinSettings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { carbRatio, correctionFactor, targetGlucose, activeInsulin } = req.body;
    const settings = await app_1.prisma.insulinSettings.upsert({
        where: { userId: req.user.id },
        update: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (carbRatio !== undefined && { carbRatio })), (correctionFactor !== undefined && { correctionFactor })), ((targetGlucose === null || targetGlucose === void 0 ? void 0 : targetGlucose.min) !== undefined && { targetGlucoseMin: targetGlucose.min })), ((targetGlucose === null || targetGlucose === void 0 ? void 0 : targetGlucose.max) !== undefined && { targetGlucoseMax: targetGlucose.max })), ((activeInsulin === null || activeInsulin === void 0 ? void 0 : activeInsulin.duration) !== undefined && { activeInsulinDuration: activeInsulin.duration })),
        create: {
            userId: req.user.id,
            carbRatio: carbRatio || 15,
            correctionFactor: correctionFactor || 50,
            targetGlucoseMin: (targetGlucose === null || targetGlucose === void 0 ? void 0 : targetGlucose.min) || 80,
            targetGlucoseMax: (targetGlucose === null || targetGlucose === void 0 ? void 0 : targetGlucose.max) || 140,
            activeInsulinDuration: (activeInsulin === null || activeInsulin === void 0 ? void 0 : activeInsulin.duration) || 4
        }
    });
    res.json({ success: true });
});
//# sourceMappingURL=insulin.controller.js.map