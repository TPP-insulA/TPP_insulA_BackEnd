import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { specs, swaggerUi } from './config/swagger';

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

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));

const port = process.env.PORT || 3000;

// Initialize PrismaClient
export const prisma = new PrismaClient();

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/insulin', insulinRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;