import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsuLA API',
      version: '1.0.0',
      description: 'API documentation for InsuLA application',
    },
    servers: [
      {
        url: 'https://tppinsulabackend-production.up.railway.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Use absolute paths and include both .ts and .js files
  apis: [
    './dist/routes/*.js',           // For production
    './dist/controllers/*.js',      // For production
    './src/routes/*.ts',           // For development
    './src/controllers/*.ts',      // For development
    './src/models/*.{ts,js}'      // For both
  ]
};

const specs = swaggerJsdoc(options);

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'InsuLA API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
    docExpansion: 'list',
    filter: true,
    showExtensions: true
  },
  explorer: true
};

export { specs, swaggerUi, swaggerUiOptions };