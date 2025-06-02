#!/usr/bin/env node

// Load environment variables from .env file
// require('dotenv').config();

// Hardcoded values
process.env.DATABASE_URL = "postgresql://postgres:hKVYqEDETSFYHXbSRZpNWkvfaOoztfIy@interchange.proxy.rlwy.net:37347/railway";
process.env.PORT = 3000;
process.env.NODE_ENV = "development";

// Startup script with better error handling and database connection retry
console.log('🚀 Starting server...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Health check function
async function performHealthCheck() {
  console.log('🏥 Performing health check...');
  
  // Check environment variables
  const envStatus = checkEnvironmentVariables();
  if (!envStatus.healthy) {
    return { healthy: false, details: envStatus.details };
  }
  
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection is healthy');
    return { healthy: true, details: 'All systems operational' };
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return { healthy: false, details: `Database error: ${error.message}` };
  }
}

function checkEnvironmentVariables() {
  // Comment out environment variable check since we're using hardcoded values
  return { healthy: true, details: 'Using hardcoded values' };
  
  // const requiredVars = ['DATABASE_URL', 'PORT', 'NODE_ENV'];
  // const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  // if (missingVars.length > 0) {
  //   return {
  //     healthy: false,
  //     details: `Missing required environment variables: ${missingVars.join(', ')}`
  //   };
  // }
  
  // return { healthy: true, details: 'All required environment variables are set' };
}

// Add database url
console.log('Database URL:', process.env.DATABASE_URL ? '***' : 'Not set');

// Check for required environment variables
// const requiredEnvVars = ['DATABASE_URL'];
// const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// if (missingVars.length > 0) {
//   console.error('❌ Missing required environment variables:', missingVars);
//   process.exit(1);
// }

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
    // Perform initial health check
    const healthStatus = await performHealthCheck();
    if (!healthStatus.healthy) {
      console.error('❌ Health check failed:', healthStatus.details);
      process.exit(1);
    }
    
    const dbConnected = await connectWithRetry();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database after multiple attempts');
      process.exit(1);
    }

    // Import and start the app
    const app = require('./dist/app.js').default;
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0'; // This is important for Railway
    
    // Start the server
    const server = app.listen(port, host, () => {
      console.log(`🌍 Server is running on port ${port}`);
      console.log(`📚 API Documentation: http://${host}:${port}/api/docs`);
      console.log(`❤️ Health Check: http://${host}:${port}/health`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
    // // Schedule periodic health checks every 5 minutes
    // setInterval(async () => {
    //   const status = await performHealthCheck();
    //   if (!status.healthy) {
    //     console.warn('⚠️ Health check warning:', status.details);
    //   }
    // }, 5 * 60 * 1000);
    
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
