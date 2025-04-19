"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.protect, activity_controller_1.createActivity);
router.get('/', auth_middleware_1.protect, activity_controller_1.getActivities);
router.get('/stats', auth_middleware_1.protect, activity_controller_1.getActivityStats);
router.put('/:id', auth_middleware_1.protect, activity_controller_1.updateActivity);
router.delete('/:id', auth_middleware_1.protect, activity_controller_1.deleteActivity);
router.get('/:id', auth_middleware_1.protect, activity_controller_1.getActivity);
exports.default = router;
//# sourceMappingURL=activity.routes.js.map