#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

// Startup script with better error handling and database connection retry
console.log('🚀 Starting server...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Add database url
console.log('Database URL:', process.env.DATABASE_URL ? '***' : 'Not set');

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

console.log('✅ Environment variables check passed');
console.log('📦 Loading application...');

// Import PrismaClient early to catch any initialization errors
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

// Database connection retry logic
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      await prisma.$connect();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        console.log(`Waiting ${delay/1000} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Start application with database connection retry
async function startApp() {
  try {
    const dbConnected = await connectWithRetry();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database after multiple attempts');
      process.exit(1);
    }

    // Import and start the app
    const app = require('./dist/app.js');
    console.log('✅ Application loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load application:', error);
    console.error('Stack trace:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  await prisma.$disconnect();
  process.exit(1);
});

// Start the application
startApp();
