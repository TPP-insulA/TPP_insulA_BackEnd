"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/upload', auth_middleware_1.protect, media_controller_1.uploadMedia);
router.get('/:type', auth_middleware_1.protect, media_controller_1.getMedia);
exports.default = router;
//# sourceMappingURL=media.routes.js.map