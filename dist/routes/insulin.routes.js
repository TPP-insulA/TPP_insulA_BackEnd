"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insulin_controller_1 = require("../controllers/insulin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.protect, insulin_controller_1.createInsulinDose);
router.get('/', auth_middleware_1.protect, insulin_controller_1.getInsulinDoses);
router.get('/stats', auth_middleware_1.protect, insulin_controller_1.getInsulinStats);
router.put('/:id', auth_middleware_1.protect, insulin_controller_1.updateInsulinDose);
router.delete('/:id', auth_middleware_1.protect, insulin_controller_1.deleteInsulinDose);
exports.default = router;
//# sourceMappingURL=insulin.routes.js.map