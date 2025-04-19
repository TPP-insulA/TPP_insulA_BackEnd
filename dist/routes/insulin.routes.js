"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const insulin_controller_1 = require("../controllers/insulin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.route('/')
    .get(insulin_controller_1.getInsulinDoses)
    .post(insulin_controller_1.createInsulinDose);
router.route('/:id')
    .get(insulin_controller_1.getInsulinDose)
    .put(insulin_controller_1.updateInsulinDose)
    .delete(insulin_controller_1.deleteInsulinDose);
exports.default = router;
//# sourceMappingURL=insulin.routes.js.map