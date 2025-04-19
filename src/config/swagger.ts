import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// Get the absolute path to the src directory
const srcDir = path.resolve(__dirname, '..');

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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://tppinsulabackend-production.up.railway.app',
        description: 'Production server',
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
  // Use absolute paths to ensure files are found in production environment
  apis: [
    path.join(srcDir, 'routes', '*.ts'),
    path.join(srcDir, 'controllers', '*.ts'),
    path.join(srcDir, 'models', '*.ts'),
  ],
};

const specs = swaggerJsdoc(options);

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'InsuLA API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
  explorer: true,
};

export { specs, swaggerUi, swaggerUiOptions };