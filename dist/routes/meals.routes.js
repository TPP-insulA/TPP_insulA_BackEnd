"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meals_controller_1 = require("../controllers/meals.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, meals_controller_1.getMeals);
router.post('/', auth_middleware_1.protect, meals_controller_1.createMeal);
router.delete('/:id', auth_middleware_1.protect, meals_controller_1.deleteMeal);
router.put('/:id', auth_middleware_1.protect, meals_controller_1.updateMeal);
exports.default = router;
//# sourceMappingURL=meals.routes.js.map