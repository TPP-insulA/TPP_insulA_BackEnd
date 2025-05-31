"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsulinPredictions = exports.calculateInsulinPrediction = exports.deleteInsulinPrediction = exports.updateInsulinPrediction = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
const string_utils_1 = require("../utils/string.utils");
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
    const { date, cgmPrev, glucoseObjective, carbs, insulinOnBoard, sleepLevel, workLevel, activityLevel, } = req.body;
    const randomNumber = String(Math.random());
    const recommendedDose = Number((0, string_utils_1.getLastDigit)(randomNumber)) || 1;
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
    const result = await app_1.prisma.$transaction(async (tx) => {
        const insulinPrediction = await tx.insulinPrediction.create({
            data
        });
        const activity = await tx.activity.create({
            data: {
                type: 'insulin',
                value: recommendedDose,
                timestamp: new Date(date),
                userId: req.user.id,
                sourceId: insulinPrediction.id,
            },
        });
        return { insulinPrediction, activity };
    });
    const predictionId = result.insulinPrediction.id;
    const responseData = Object.assign(Object.assign({}, data), { id: predictionId });
    res.json(responseData);
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