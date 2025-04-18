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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
/**
 * Middleware to protect routes that require authentication
 */
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // Check if token exists in headers
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
            // Get user from token
            const user = yield app_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Set user in request object with combined name
            req.user = Object.assign(Object.assign({}, user), { name: `${user.firstName} ${user.lastName}` });
            next();
        }
        catch (error) {
            console.error('Authentication error:', error);
            const err = new Error('Not authorized, token failed');
            err.statusCode = 401;
            next(err);
        }
    }
    else {
        const err = new Error('Not authorized, no token');
        err.statusCode = 401;
        next(err);
    }
});
exports.protect = protect;
