"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.getDashboardData = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const glucoseWhere = { userId: req.user.id };
    if (startDate || endDate) {
        glucoseWhere.timestamp = {};
        if (startDate)
            glucoseWhere.timestamp.gte = new Date(startDate);
        if (endDate)
            glucoseWhere.timestamp.lte = new Date(endDate);
    }
    const glucoseReadings = await app_1.prisma.glucoseReading.findMany({
        where: glucoseWhere,
        orderBy: { timestamp: 'desc' },
        take: 100,
    });
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.id },
    });
    const activities = await app_1.prisma.activity.findMany({
        where: { userId: req.user.id },
        orderBy: { timestamp: 'desc' },
        take: 100,
    });
    const predictionHistory = await app_1.prisma.insulinPrediction.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
    });
    res.json({
        glucoseReadings,
        userProfile: user,
        activities,
        predictions: predictionHistory,
    });
});
//# sourceMappingURL=dashboard.controller.js.map