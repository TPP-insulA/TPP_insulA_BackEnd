"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', user_controller_1.registerUser);
router.post('/login', user_controller_1.loginUser);
// Protected routes
router.get('/profile', auth_middleware_1.protect, user_controller_1.getUserProfile);
router.put('/profile', auth_middleware_1.protect, user_controller_1.updateUserProfile);
router.put('/glucose-target', auth_middleware_1.protect, user_controller_1.updateGlucoseTarget);
router.delete('/', auth_middleware_1.protect, user_controller_1.deleteUser);
exports.default = router;
