"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const glucose_controller_1 = require("../controllers/glucose.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes are protected
router.use(auth_middleware_1.protect);
router.route('/')
    .get(glucose_controller_1.getGlucoseReadings)
    .post(glucose_controller_1.createGlucoseReading);
router.route('/:id')
    .get(glucose_controller_1.getGlucoseReading)
    .put(glucose_controller_1.updateGlucoseReading)
    .delete(glucose_controller_1.deleteGlucoseReading);
exports.default = router;
