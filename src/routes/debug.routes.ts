import { Router, Request, Response } from 'express';

const router = Router();

// Debug route to show all available routes
router.get('/routes', (req: Request, res: Response) => {
  const app = req.app;
  const routes: any[] = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
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

// Environment info endpoint
router.get('/env', (req: Request, res: Response) => {
  res.json({
    success: true,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  });
});

export default router;