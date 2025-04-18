"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_1 = require("./config/swagger");
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const glucose_routes_1 = __importDefault(require("./routes/glucose.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const insulin_routes_1 = __importDefault(require("./routes/insulin.routes"));
// Middleware
const error_middleware_1 = require("./middleware/error.middleware");
// Config
dotenv_1.default.config();
const app = (0, express_1.default)();
// Initialize PrismaClient
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'error', 'warn'],
});
// Middleware
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf.toString());
        }
        catch (e) {
            console.error('Invalid JSON input:', e);
            // Use Express Response type by casting or handling differently
            res.status(400).json({ success: false, message: 'Invalid JSON payload' });
            throw new Error('Invalid JSON');
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Configure CORS with more permissive settings for development/production
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    maxAge: 86400, // 24 hours
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Add detailed request logging middleware
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    else {
        console.log('Request Body: Empty or not parsed');
    }
    next();
});
// Routes
app.use('/api/users', user_routes_1.default);
app.use('/api/glucose', glucose_routes_1.default);
app.use('/api/activities', activity_routes_1.default);
app.use('/api/insulin', insulin_routes_1.default);
// Swagger Documentation
app.use('/api-docs', swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
// Error handling middleware
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
const port = Number(process.env.PORT) || 3000;
// Start server
if (require.main === module) {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`⚡️[server]: Server is running on port ${port}`);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Database connection established');
    });
    // Handle graceful shutdown
    const shutdown = () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Shutting down gracefully...');
        yield exports.prisma.$disconnect();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
exports.default = app;
