"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
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
//# sourceMappingURL=activity.controller.js.map