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
exports.getGlucoseStats = exports.deleteGlucoseReading = exports.updateGlucoseReading = exports.createGlucoseReading = exports.getGlucoseReading = exports.getGlucoseReadings = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * @swagger
 * /api/glucose:
 *   get:
 *     summary: Get user's glucose readings
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering readings
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering readings
 *     responses:
 *       200:
 *         description: List of glucose readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   value:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   notes:
 *                     type: string
 */
exports.getGlucoseReadings = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const readings = yield app_1.prisma.glucoseReading.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
    });
    res.json(readings);
}));
/**
 * Get a single glucose reading by id
 * @route GET /api/glucose/:id
 * @access Private
 */
exports.getGlucoseReading = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const reading = yield app_1.prisma.glucoseReading.findFirst({
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
}));
/**
 * @swagger
 * /api/glucose:
 *   post:
 *     summary: Add a new glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - timestamp
 *             properties:
 *               value:
 *                 type: number
 *                 description: Glucose reading value in mg/dL
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Glucose reading created successfully
 *       400:
 *         description: Invalid input data
 */
exports.createGlucoseReading = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { value, notes } = req.body;
    // Get the user's target range
    const target = yield app_1.prisma.glucoseTarget.findUnique({
        where: { userId: req.user.id },
    });
    const reading = yield app_1.prisma.glucoseReading.create({
        data: {
            value,
            notes,
            userId: req.user.id,
        },
    });
    // Also create an activity record for this reading
    yield app_1.prisma.activity.create({
        data: {
            type: 'glucose',
            value,
            timestamp: reading.timestamp,
            userId: req.user.id,
        },
    });
    // Return the reading with status information based on the target range
    let status = 'in-range';
    if (target) {
        if (value < target.minTarget)
            status = 'low';
        if (value > target.maxTarget)
            status = 'high';
    }
    res.status(201).json(Object.assign(Object.assign({}, reading), { status }));
}));
/**
 * @swagger
 * /api/glucose/{id}:
 *   put:
 *     summary: Update a glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the glucose reading
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Glucose reading updated successfully
 *       404:
 *         description: Glucose reading not found
 */
exports.updateGlucoseReading = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { value, notes } = req.body;
    const reading = yield app_1.prisma.glucoseReading.findFirst({
        where: {
            id,
            userId: req.user.id
        },
    });
    if (!reading) {
        res.status(404);
        throw new Error('Glucose reading not found');
    }
    const updatedReading = yield app_1.prisma.glucoseReading.update({
        where: { id },
        data: {
            value: value !== undefined ? value : reading.value,
            notes: notes !== undefined ? notes : reading.notes,
        },
    });
    // If value was updated, also update the corresponding activity
    if (value !== undefined && value !== reading.value) {
        yield app_1.prisma.activity.updateMany({
            where: {
                type: 'glucose',
                userId: req.user.id,
                timestamp: reading.timestamp,
            },
            data: {
                value,
            },
        });
    }
    res.json(updatedReading);
}));
/**
 * @swagger
 * /api/glucose/{id}:
 *   delete:
 *     summary: Delete a glucose reading
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the glucose reading
 *     responses:
 *       200:
 *         description: Glucose reading deleted successfully
 *       404:
 *         description: Glucose reading not found
 */
exports.deleteGlucoseReading = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const reading = yield app_1.prisma.glucoseReading.findFirst({
        where: {
            id,
            userId: req.user.id
        },
    });
    if (!reading) {
        res.status(404);
        throw new Error('Glucose reading not found');
    }
    yield app_1.prisma.$transaction([
        // Delete the glucose reading
        app_1.prisma.glucoseReading.delete({
            where: { id },
        }),
        // Delete the corresponding activity
        app_1.prisma.activity.deleteMany({
            where: {
                type: 'glucose',
                userId: req.user.id,
                timestamp: reading.timestamp,
            },
        }),
    ]);
    res.json({ message: 'Glucose reading deleted' });
}));
/**
 * @swagger
 * /api/glucose/stats:
 *   get:
 *     summary: Get glucose statistics
 *     tags: [Glucose]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for calculating statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for calculating statistics
 *     responses:
 *       200:
 *         description: Glucose statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageGlucose:
 *                   type: number
 *                 highReadings:
 *                   type: number
 *                 lowReadings:
 *                   type: number
 *                 inRangeReadings:
 *                   type: number
 *                 totalReadings:
 *                   type: number
 */
exports.getGlucoseStats = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // ...existing code...
}));
