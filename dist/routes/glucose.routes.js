"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const glucose_controller_1 = require("../controllers/glucose.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post('/', glucose_controller_1.createGlucoseReading);
router.get('/', glucose_controller_1.getGlucoseReadings);
exports.default = router;
//# sourceMappingURL=glucose.routes.js.map