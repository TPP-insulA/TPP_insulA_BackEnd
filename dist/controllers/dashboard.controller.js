"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = exports.chatWithAI = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
exports.chatWithAI = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    var _a, _b, _c, _d, _e;
    let { contents } = req.body;
    console.log('[Chat] Received contents:', contents);
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'contents debe ser un array.' });
    }
    let prompt = '';
    if (typeof contents[0] === 'string') {
        prompt = contents.join('\n');
    }
    else if (typeof contents[0] === 'object' && Array.isArray(contents[0].parts)) {
        prompt = contents.map((c) => { var _a; return (_a = c.parts) === null || _a === void 0 ? void 0 : _a.map((p) => p.text).join(' '); }).join('\n');
    }
    else {
        return res.status(400).json({ error: 'Formato de contents no soportado.' });
    }
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el entorno.' });
    }
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            }),
        });
        const json = await response.json();
        const answer = ((_e = (_d = (_c = (_b = (_a = json.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || 'No response from AI';
        console.log('[Chat] Gemini API answer:', answer);
        return res.json(json);
    }
    catch (err) {
        console.error('[Chat] Gemini API error:', err);
        return res.status(500).json({ error: 'Hubo un error al conectar con el asistente. Intenta más tarde.' });
    }
});
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