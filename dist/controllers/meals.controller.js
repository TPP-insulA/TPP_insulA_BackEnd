"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMeal = exports.updateMeal = exports.createMeal = exports.getMeals = void 0;
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
        include: {
            mealFoods: {
                include: {
                    food: true
                }
            }
        }
    });
    res.json({
        success: true,
        data: meals
    });
});
exports.createMeal = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { name, description, type, foods, timestamp, photo } = req.body;
    if (!name || !type || !foods || !Array.isArray(foods) || foods.length === 0) {
        res.status(400).json({
            success: false,
            message: "Missing required fields or invalid foods array"
        });
        return;
    }
    try {
        const mealTimestamp = timestamp ? new Date(timestamp) : new Date();
        const totals = foods.reduce((acc, food) => ({
            carbs: acc.carbs + food.carbs,
            protein: acc.protein + food.protein,
            fat: acc.fat + food.fat,
            calories: acc.calories + food.calories
        }), {
            carbs: 0,
            protein: 0,
            fat: 0,
            calories: 0
        });
        const meal = await app_1.prisma.meal.create({
            data: Object.assign(Object.assign({ name,
                description,
                type }, totals), { photo, timestamp: mealTimestamp, userId: req.user.id, mealFoods: {
                    create: await Promise.all(foods.map(async (food) => {
                        const createdFood = await app_1.prisma.food.create({
                            data: {
                                name: food.name,
                                carbs: food.carbs,
                                protein: food.protein,
                                fat: food.fat,
                                calories: food.calories,
                                servingSize: food.servingSize
                            }
                        });
                        return {
                            quantity: food.quantity,
                            foodId: createdFood.id
                        };
                    }))
                } }),
            include: {
                mealFoods: {
                    include: {
                        food: true
                    }
                }
            }
        });
        await app_1.prisma.activity.create({
            data: {
                type: 'meal',
                value: totals.calories,
                mealType: type,
                carbs: totals.carbs,
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
exports.updateMeal = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, description, type, foods, timestamp, photo } = req.body;
    try {
        const existingMeal = await app_1.prisma.meal.findFirst({
            where: {
                id,
                userId: req.user.id
            },
            include: {
                mealFoods: true
            }
        });
        if (!existingMeal) {
            res.status(404).json({
                success: false,
                message: "Meal not found"
            });
            return;
        }
        let updateData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name !== undefined && { name })), (description !== undefined && { description })), (type !== undefined && { type })), (photo !== undefined && { photo })), (timestamp && { timestamp: new Date(timestamp) }));
        if (foods && Array.isArray(foods)) {
            const totals = foods.reduce((acc, food) => ({
                carbs: acc.carbs + food.carbs,
                protein: acc.protein + food.protein,
                fat: acc.fat + food.fat,
                calories: acc.calories + food.calories
            }), {
                carbs: 0,
                protein: 0,
                fat: 0,
                calories: 0
            });
            updateData = Object.assign(Object.assign(Object.assign({}, updateData), totals), { mealFoods: {
                    deleteMany: {},
                    create: await Promise.all(foods.map(async (food) => {
                        const createdFood = await app_1.prisma.food.create({
                            data: {
                                name: food.name,
                                carbs: food.carbs,
                                protein: food.protein,
                                fat: food.fat,
                                calories: food.calories,
                                servingSize: food.servingSize
                            }
                        });
                        return {
                            quantity: food.quantity,
                            foodId: createdFood.id
                        };
                    }))
                } });
        }
        const updatedMeal = await app_1.prisma.meal.update({
            where: { id },
            data: updateData,
            include: {
                mealFoods: {
                    include: {
                        food: true
                    }
                }
            }
        });
        if (type !== undefined || (foods && Array.isArray(foods))) {
            await app_1.prisma.activity.updateMany({
                where: {
                    type: 'meal',
                    userId: req.user.id,
                    timestamp: existingMeal.timestamp
                },
                data: Object.assign(Object.assign({}, (type !== undefined && { mealType: type })), (foods !== undefined && {
                    value: updateData.calories,
                    carbs: updateData.carbs
                }))
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
//# sourceMappingURL=meals.controller.js.map