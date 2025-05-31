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

// Debug endpoint to check system status
router.get('/status', async (req, res) => {
  try {
    const { prisma } = await import('../app');
    
    // Test database connection
    let dbStatus = 'Unknown';
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      dbStatus = 'Connected';
    } catch (dbError) {
      dbStatus = `Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      },
      database: {
        status: dbStatus,
        prismaVersion: '4.15.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Test user registration validation without actually creating a user
router.post('/test-validation', (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      birthDay, 
      birthMonth, 
      birthYear, 
      weight, 
      height,
      glucoseProfile 
    } = req.body;

    const validationErrors: string[] = [];
    
    // Email validation
    if (!email) {
      validationErrors.push('Email is required');
    } else if (typeof email !== 'string') {
      validationErrors.push('Email must be a string');
    }
    
    // Add other validations here as needed...
    
    res.json({
      status: 'OK',
      message: 'Validation test completed',
      receivedData: {
        email: email || 'NOT_PROVIDED',
        firstName: firstName || 'NOT_PROVIDED',
        lastName: lastName || 'NOT_PROVIDED',
        hasPassword: !!password,
        birthDay: birthDay || 'NOT_PROVIDED',
        birthMonth: birthMonth || 'NOT_PROVIDED',
        birthYear: birthYear || 'NOT_PROVIDED',
        weight: weight || 'NOT_PROVIDED',
        height: height || 'NOT_PROVIDED',
        glucoseProfile: glucoseProfile || 'NOT_PROVIDED'
      },
      validationErrors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;