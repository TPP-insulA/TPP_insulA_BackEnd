"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, dashboard_controller_1.getDashboardData);
router.post('/chat', auth_middleware_1.protect, dashboard_controller_1.chatWithAI);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map