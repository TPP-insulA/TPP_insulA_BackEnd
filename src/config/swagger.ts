import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// Get the absolute path to the src directory
const srcDir = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';
const fileExtension = isProd ? 'js' : 'ts';

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
  // Handle both .ts and .js files depending on environment
  apis: [
    path.join(srcDir, 'routes', `*.${fileExtension}`),
    path.join(srcDir, 'controllers', `*.${fileExtension}`),
    path.join(srcDir, 'models', `*.${fileExtension}`)
  ],
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