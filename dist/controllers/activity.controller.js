"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteActivity = exports.updateActivity = exports.createActivity = exports.getActivity = exports.getActivities = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Get all activities for the current user
 * @route GET /api/activities
 * @access Private
 */
exports.getActivities = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, type, limit = 100 } = req.query;
    const whereClause = {
        userId: req.user.id
    };
    // Add type filter if provided
    if (type) {
        whereClause.type = type;
    }
    // Add date filters if provided
    if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
            whereClause.timestamp.gte = new Date(startDate);
        }
        if (endDate) {
            whereClause.timestamp.lte = new Date(endDate);
        }
    }
    const activities = yield app_1.prisma.activity.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(activities);
}));
/**
 * Get a single activity by id
 * @route GET /api/activities/:id
 * @access Private
 */
exports.getActivity = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const activity = yield app_1.prisma.activity.findFirst({
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
}));
/**
 * Create a new activity
 * @route POST /api/activities
 * @access Private
 */
exports.createActivity = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, value, mealType, carbs, units } = req.body;
    // Validate based on activity type
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
    const activity = yield app_1.prisma.activity.create({
        data: {
            type,
            value,
            mealType,
            carbs,
            units,
            userId: req.user.id,
        },
    });
    // If this is an insulin dose, also create an insulin dose record
    if (type === 'insulin' && units) {
        yield app_1.prisma.insulinDose.create({
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
}));
/**
 * Update an activity
 * @route PUT /api/activities/:id
 * @access Private
 */
exports.updateActivity = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { type, value, mealType, carbs, units } = req.body;
    const activity = yield app_1.prisma.activity.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!activity) {
        res.status(404);
        throw new Error('Activity not found');
    }
    const updatedActivity = yield app_1.prisma.activity.update({
        where: { id },
        data: {
            type: type !== undefined ? type : activity.type,
            value: value !== undefined ? value : activity.value,
            mealType: mealType !== undefined ? mealType : activity.mealType,
            carbs: carbs !== undefined ? carbs : activity.carbs,
            units: units !== undefined ? units : activity.units,
        },
    });
    // If this is an insulin activity and units changed, update the corresponding insulin dose
    if (activity.type === 'insulin' && (units !== undefined || value !== undefined || carbs !== undefined)) {
        yield app_1.prisma.insulinDose.updateMany({
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
}));
/**
 * Delete an activity
 * @route DELETE /api/activities/:id
 * @access Private
 */
exports.deleteActivity = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const activity = yield app_1.prisma.activity.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!activity) {
        res.status(404);
        throw new Error('Activity not found');
    }
    yield app_1.prisma.$transaction([
        // Delete the activity
        app_1.prisma.activity.delete({
            where: { id },
        }),
        // If this was an insulin activity, also delete the corresponding insulin dose
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
}));
