"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMeal = exports.deleteMeal = exports.createMeal = exports.getMeals = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getMeals = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, limit = 100 } = req.query;
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
    const meals = await app_1.prisma.meal.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json({
        success: true,
        data: meals
    });
});
exports.createMeal = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { name, description, carbs, protein, fat, calories, quantity = 1, timestamp, photo } = req.body;
    if (!name ||
        carbs === undefined || carbs === null ||
        protein === undefined || protein === null ||
        fat === undefined || fat === null ||
        calories === undefined || calories === null) {
        res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
        return;
    }
    try {
        const mealTimestamp = timestamp ? new Date(timestamp) : new Date();
        const meal = await app_1.prisma.meal.create({
            data: {
                name,
                description,
                carbs,
                protein,
                fat,
                calories,
                quantity,
                photo,
                timestamp: mealTimestamp,
                userId: req.user.id
            }
        });
        await app_1.prisma.activity.create({
            data: {
                type: 'meal',
                value: calories,
                mealType: 'other',
                carbs,
                timestamp: mealTimestamp,
                userId: req.user.id
            }
        });
        res.status(201).json({
            success: true,
            data: meal
        });
    }
    catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({
            success: false,
            message: "Failed to create meal"
        });
    }
});
exports.deleteMeal = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    try {
        const meal = await app_1.prisma.meal.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!meal) {
            res.status(404).json({
                success: false,
                message: "Meal not found"
            });
            return;
        }
        await app_1.prisma.$transaction([
            app_1.prisma.meal.delete({
                where: { id }
            }),
            app_1.prisma.activity.deleteMany({
                where: {
                    type: 'meal',
                    userId: req.user.id,
                    timestamp: meal.timestamp
                }
            })
        ]);
        res.json({
            success: true,
            message: "Meal deleted successfully"
        });
    }
    catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({
            success: false,
            message: "Failed to delete meal"
        });
    }
});
exports.updateMeal = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, description, carbs, protein, fat, calories, quantity, timestamp, photo } = req.body;
    try {
        const existingMeal = await app_1.prisma.meal.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingMeal) {
            res.status(404).json({
                success: false,
                message: "Meal not found"
            });
            return;
        }
        if ((name !== undefined && !name) ||
            (carbs !== undefined && (carbs === null)) ||
            (protein !== undefined && (protein === null)) ||
            (fat !== undefined && (fat === null)) ||
            (calories !== undefined && (calories === null))) {
            res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
            return;
        }
        const mealTimestamp = timestamp ? new Date(timestamp) : undefined;
        const updatedMeal = await app_1.prisma.meal.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name !== undefined && { name })), (description !== undefined && { description })), (carbs !== undefined && { carbs })), (protein !== undefined && { protein })), (fat !== undefined && { fat })), (calories !== undefined && { calories })), (quantity !== undefined && { quantity })), (photo !== undefined && { photo })), (mealTimestamp && { timestamp: mealTimestamp }))
        });
        if (calories !== undefined || carbs !== undefined) {
            await app_1.prisma.activity.updateMany({
                where: {
                    type: 'meal',
                    userId: req.user.id,
                    timestamp: existingMeal.timestamp
                },
                data: Object.assign(Object.assign({}, (calories !== undefined && { value: calories })), (carbs !== undefined && { carbs }))
            });
        }
        res.json({
            success: true,
            data: updatedMeal
        });
    }
    catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update meal"
        });
    }
});
//# sourceMappingURL=meals.controller.js.map