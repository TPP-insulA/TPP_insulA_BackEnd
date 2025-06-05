"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlucoseReading = exports.getGlucoseReadings = void 0;
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
exports.createGlucoseReading = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { value, notes, date } = req.body;
    const user = await app_1.prisma.user.findFirst({
        where: { id: req.user.id },
    });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const target = {
        minTarget: user.minTargetGlucose || 70,
        maxTarget: user.maxTargetGlucose || 180,
    };
    const result = await app_1.prisma.$transaction(async (tx) => {
        const reading = await tx.glucoseReading.create({
            data: {
                value,
                timestamp: date ? new Date(date) : new Date(),
                notes,
                userId: req.user.id,
            },
        });
        const activity = await tx.activity.create({
            data: {
                type: 'glucose',
                value,
                notes,
                timestamp: reading.timestamp,
                userId: req.user.id,
                sourceId: reading.id,
            },
        });
        return { reading, activity };
    });
    const reading = result.reading;
    let status = 'in-range';
    if (value < target.minTarget)
        status = 'low';
    if (value > target.maxTarget)
        status = 'high';
    res.status(201).json(Object.assign(Object.assign({}, reading), { status }));
});
//# sourceMappingURL=glucose.controller.js.map