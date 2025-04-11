"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes are protected
router.use(auth_middleware_1.protect);
router.route('/')
    .get(activity_controller_1.getActivities)
    .post(activity_controller_1.createActivity);
router.route('/:id')
    .get(activity_controller_1.getActivity)
    .put(activity_controller_1.updateActivity)
    .delete(activity_controller_1.deleteActivity);
exports.default = router;
