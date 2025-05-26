"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insulin_controller_1 = require("../controllers/insulin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
router.use(auth_middleware_1.protect);
router.use(apiLimiter);
router.route('/doses')
    .get(insulin_controller_1.getInsulinDoses)
    .post(insulin_controller_1.createInsulinDose);
router.delete('/doses/:id', insulin_controller_1.deleteInsulinDose);
router.post('/calculate', insulin_controller_1.calculateInsulinDose);
router.route('/predictions')
    .get(insulin_controller_1.getInsulinPredictions)
    .post(insulin_controller_1.logPredictionResult);
router.route('/settings')
    .get(insulin_controller_1.getInsulinSettings)
    .put(insulin_controller_1.updateInsulinSettings);
router.post('/', auth_middleware_1.protect, insulin_controller_1.createInsulinDose);
router.get('/', auth_middleware_1.protect, insulin_controller_1.getInsulinDoses);
router.put('/:id', auth_middleware_1.protect, insulin_controller_1.updateInsulinDose);
router.delete('/:id', auth_middleware_1.protect, insulin_controller_1.deleteInsulinDose);
exports.default = router;
//# sourceMappingURL=insulin.routes.js.map