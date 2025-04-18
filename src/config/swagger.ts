import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
        url: 'https://tppinsulabackend-production.up.railway.app/api',
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
  apis: ['./src/controllers/*.ts', './src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };