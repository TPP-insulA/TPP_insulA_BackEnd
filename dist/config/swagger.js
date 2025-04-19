"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUiOptions = exports.swaggerUi = exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
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
    apis: [
        './dist/routes/*.js',
        './dist/controllers/*.js',
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/models/*.{ts,js}'
    ]
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.specs = specs;
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
exports.swaggerUiOptions = swaggerUiOptions;
//# sourceMappingURL=swagger.js.map