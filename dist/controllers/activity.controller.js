"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityStats = exports.deleteActivity = exports.updateActivity = exports.getActivity = exports.getActivities = exports.createActivity = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.createActivity = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { type, value, mealType, carbs, units } = req.body;
    if (type === 'meal' && !mealType) {
        res.status(400);
        throw new Error('Meal type is required for meal activities');
    }
    if (type === 'meal' && !carbs) {
        res.status(400);
        throw new Error('Carbs value is required for meal activities');
    }
    if (type === 'insulin' && !units) {
        res.status(400);
        throw new Error('Units value is required for insulin activities');
    }
    const activity = await app_1.prisma.activity.create({
        data: {
            type,
            value,
            mealType,
            carbs,
            units,
            userId: req.user.id,
        },
    });
    if (type === 'insulin' && units) {
        await app_1.prisma.insulinDose.create({
            data: {
                units,
                glucoseLevel: value,
                carbIntake: carbs,
                userId: req.user.id,
                timestamp: activity.timestamp,
            },
        });
    }
    res.status(201).json(activity);
});
exports.getActivities = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, type, limit = 100 } = req.query;
    const whereClause = {
        userId: req.user.id
    };
    if (type) {
        whereClause.type = type;
    }
    if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
            whereClause.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
            whereClause.timestamp.lte = new Date(endDate);
        }
    }
    const activities = await app_1.prisma.activity.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(activities);
});
exports.getActivity = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const activity = await app_1.prisma.activity.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!activity) {
        res.status(404);
        throw new Error('Activity not found');
    }
    res.json(activity);
});
exports.updateActivity = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { type, value, mealType, carbs, units } = req.body;
    const activity = await app_1.prisma.activity.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!activity) {
        res.status(404);
        throw new Error('Activity not found');
    }
    const updatedActivity = await app_1.prisma.activity.update({
        where: { id },
        data: {
            type: type !== undefined ? type : activity.type,
            value: value !== undefined ? value : activity.value,
            mealType: mealType !== undefined ? mealType : activity.mealType,
            carbs: carbs !== undefined ? carbs : activity.carbs,
            units: units !== undefined ? units : activity.units,
        },
    });
    if (activity.type === 'insulin' && (units !== undefined || value !== undefined || carbs !== undefined)) {
        await app_1.prisma.insulinDose.updateMany({
            where: {
                userId: req.user.id,
                timestamp: activity.timestamp,
            },
            data: {
                units: units !== undefined ? units : activity.units,
                glucoseLevel: value !== undefined ? value : activity.value,
                carbIntake: carbs !== undefined ? carbs : activity.carbs,
            },
        });
    }
    res.json(updatedActivity);
});
exports.deleteActivity = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const activity = await app_1.prisma.activity.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!activity) {
        res.status(404);
        throw new Error('Activity not found');
    }
    await app_1.prisma.$transaction([
        app_1.prisma.activity.delete({
            where: { id },
        }),
        ...(activity.type === 'insulin'
            ? [
                app_1.prisma.insulinDose.deleteMany({
                    where: {
                        userId: req.user.id,
                        timestamp: activity.timestamp,
                    },
                }),
            ]
            : []),
    ]);
    res.json({ message: 'Activity deleted' });
});
exports.getActivityStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
});
//# sourceMappingURL=activity.controller.js.map