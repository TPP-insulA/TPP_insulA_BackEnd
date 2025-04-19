"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const food_controller_1 = require("../controllers/food.controller");
const router = (0, express_1.Router)();
router.get('/debug', (req, res) => {
    res.json({
        success: true,
        message: 'Food router is working',
        availableRoutes: [
            { path: '/process-image', method: 'POST' },
            { path: '/process-food-name', method: 'POST' }
        ],
        environmentInfo: {
            nodeEnv: process.env.NODE_ENV,
            hasNinjaKey: !!process.env.NINJA_CALORIE_API_KEY
        }
    });
});
router.post('/process-image', food_controller_1.processFoodImage);
router.post('/process-food-name', food_controller_1.processFoodName);
exports.default = router;
//# sourceMappingURL=food.routes.js.map