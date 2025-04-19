"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/routes', (req, res) => {
    const app = req.app;
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
        else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const basePath = middleware.regexp.toString()
                        .replace('\\/?(?=\\/|$)', '')
                        .replace(/^\^\\/, '')
                        .replace(/\\\/\$/, '')
                        .replace(/\\\//g, '/');
                    routes.push({
                        path: basePath + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({
        success: true,
        environment: process.env.NODE_ENV,
        routes,
        foodRoutesRegistered: routes.some(r => r.path.includes('/food')),
        processImageRouteRegistered: routes.some(r => r.path.includes('/food/process-image')),
        processFoodNameRouteRegistered: routes.some(r => r.path.includes('/food/process-food-name'))
    });
});
router.get('/env', (req, res) => {
    res.json({
        success: true,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
    });
});
exports.default = router;
//# sourceMappingURL=debug.routes.js.map