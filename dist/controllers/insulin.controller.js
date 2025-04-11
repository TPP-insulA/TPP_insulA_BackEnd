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
exports.deleteInsulinDose = exports.updateInsulinDose = exports.createInsulinDose = exports.getInsulinDose = exports.getInsulinDoses = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Get all insulin doses for the current user
 * @route GET /api/insulin
 * @access Private
 */
exports.getInsulinDoses = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, limit = 100 } = req.query;
    const whereClause = {
        userId: req.user.id
    };
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
    const doses = yield app_1.prisma.insulinDose.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(doses);
}));
/**
 * Get a single insulin dose by id
 * @route GET /api/insulin/:id
 * @access Private
 */
exports.getInsulinDose = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dose = yield app_1.prisma.insulinDose.findFirst({
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
}));
/**
 * Create a new insulin dose
 * @route POST /api/insulin
 * @access Private
 */
exports.createInsulinDose = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { units, glucoseLevel, carbIntake } = req.body;
    const dose = yield app_1.prisma.insulinDose.create({
        data: {
            units,
            glucoseLevel,
            carbIntake,
            userId: req.user.id,
        },
    });
    // Also create an activity record for this insulin dose
    yield app_1.prisma.activity.create({
        data: {
            type: 'insulin',
            value: glucoseLevel,
            carbs: carbIntake,
            units,
            timestamp: dose.timestamp,
            userId: req.user.id,
        },
    });
    res.status(201).json(dose);
}));
/**
 * Update an insulin dose
 * @route PUT /api/insulin/:id
 * @access Private
 */
exports.updateInsulinDose = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { units, glucoseLevel, carbIntake } = req.body;
    const dose = yield app_1.prisma.insulinDose.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!dose) {
        res.status(404);
        throw new Error('Insulin dose not found');
    }
    const updatedDose = yield app_1.prisma.insulinDose.update({
        where: { id },
        data: {
            units: units !== undefined ? units : dose.units,
            glucoseLevel: glucoseLevel !== undefined ? glucoseLevel : dose.glucoseLevel,
            carbIntake: carbIntake !== undefined ? carbIntake : dose.carbIntake,
        },
    });
    // Also update the corresponding activity
    yield app_1.prisma.activity.updateMany({
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
}));
/**
 * Delete an insulin dose
 * @route DELETE /api/insulin/:id
 * @access Private
 */
exports.deleteInsulinDose = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dose = yield app_1.prisma.insulinDose.findFirst({
        where: {
            id,
            userId: req.user.id,
        },
    });
    if (!dose) {
        res.status(404);
        throw new Error('Insulin dose not found');
    }
    yield app_1.prisma.$transaction([
        // Delete the insulin dose
        app_1.prisma.insulinDose.delete({
            where: { id },
        }),
        // Delete the corresponding activity
        app_1.prisma.activity.deleteMany({
            where: {
                type: 'insulin',
                userId: req.user.id,
                timestamp: dose.timestamp,
            },
        }),
    ]);
    res.json({ message: 'Insulin dose deleted' });
}));
