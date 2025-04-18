import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { specs, swaggerUi } from './config/swagger';
import http from 'http'; // Add this import for ServerResponse

// Routes
import userRoutes from './routes/user.routes';
import glucoseRoutes from './routes/glucose.routes';
import activityRoutes from './routes/activity.routes';
import insulinRoutes from './routes/insulin.routes';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Config
dotenv.config();
const app: Express = express();

// Initialize PrismaClient
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Middleware
app.use(express.json({
  limit: '10mb',
  verify: (req: http.IncomingMessage, res: http.ServerResponse, buf: Buffer) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      console.error('Invalid JSON input:', e);
      // Use Express Response type by casting or handling differently
      (res as Response).status(400).json({ success: false, message: 'Invalid JSON payload' });
      throw new Error('Invalid JSON');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS with more permissive settings for development/production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

app.use(helmet());
app.use(morgan('dev'));

// Add detailed request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('Request Body: Empty or not parsed');
  }
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/insulin', insulinRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;

// Start server
if (require.main === module) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`⚡️[server]: Server is running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database connection established');
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;