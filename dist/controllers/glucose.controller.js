"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlucoseStats = exports.deleteGlucoseReading = exports.updateGlucoseReading = exports.createGlucoseReading = exports.getGlucoseReading = exports.getGlucoseReadings = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getGlucoseReadings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const readings = await app_1.prisma.glucoseReading.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(readings);
});
exports.getGlucoseReading = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const reading = await app_1.prisma.glucoseReading.findFirst({
        where: {
            id,
            userId: req.user.id
        },
    });
    if (!reading) {
        res.status(404);
        throw new Error('Glucose reading not found');
    }
    res.json(reading);
});
exports.createGlucoseReading = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { value, notes } = req.body;
    const target = await app_1.prisma.glucoseTarget.findUnique({
        where: { userId: req.user.id },
    });
    const reading = await app_1.prisma.glucoseReading.create({
        data: {
            value,
            notes,
            userId: req.user.id,
        },
    });
    await app_1.prisma.activity.create({
        data: {
            type: 'glucose',
            value,
            notes,
            timestamp: reading.timestamp,
            userId: req.user.id,
        },
    });
    let status = 'in-range';
    if (target) {
        if (value < target.minTarget)
            status = 'low';
        if (value > target.maxTarget)
            status = 'high';
    }
    res.status(201).json(Object.assign(Object.assign({}, reading), { status }));
});
exports.updateGlucoseReading = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { value, notes } = req.body;
    const reading = await app_1.prisma.glucoseReading.findFirst({
        where: {
            id,
            userId: req.user.id
        },
    });
    if (!reading) {
        res.status(404);
        throw new Error('Glucose reading not found');
    }
    const updatedReading = await app_1.prisma.glucoseReading.update({
        where: { id },
        data: {
            value: value !== undefined ? value : reading.value,
            notes: notes !== undefined ? notes : reading.notes,
        },
    });
    if (value !== undefined || notes !== undefined) {
        await app_1.prisma.activity.updateMany({
            where: {
                type: 'glucose',
                userId: req.user.id,
                timestamp: reading.timestamp,
            },
            data: Object.assign(Object.assign({}, (value !== undefined && { value })), (notes !== undefined && { notes })),
        });
    }
    res.json(updatedReading);
});
exports.deleteGlucoseReading = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const reading = await app_1.prisma.glucoseReading.findFirst({
        where: {
            id,
            userId: req.user.id
        },
    });
    if (!reading) {
        res.status(404);
        throw new Error('Glucose reading not found');
    }
    await app_1.prisma.$transaction([
        app_1.prisma.glucoseReading.delete({
            where: { id },
        }),
        app_1.prisma.activity.deleteMany({
            where: {
                type: 'glucose',
                userId: req.user.id,
                timestamp: reading.timestamp,
            },
        }),
    ]);
    res.json({ message: 'Glucose reading deleted' });
});
exports.getGlucoseStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
});
//# sourceMappingURL=glucose.controller.js.map