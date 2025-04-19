"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsulinStats = exports.deleteInsulinDose = exports.updateInsulinDose = exports.getInsulinDose = exports.getInsulinDoses = exports.createInsulinDose = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.createInsulinDose = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { units, glucoseLevel, carbIntake } = req.body;
    const dose = await app_1.prisma.insulinDose.create({
        data: {
            units,
            glucoseLevel,
            carbIntake,
            userId: req.user.id,
        },
    });
    await app_1.prisma.activity.create({
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
});
exports.getInsulinDoses = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const doses = await app_1.prisma.insulinDose.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(doses);
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
    res.json({ message: 'Insulin dose deleted' });
});
exports.getInsulinStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
});
//# sourceMappingURL=insulin.controller.js.map