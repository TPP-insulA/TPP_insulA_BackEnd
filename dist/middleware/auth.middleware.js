"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
            const user = await app_1.prisma.user.findUnique({
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
};
exports.protect = protect;
//# sourceMappingURL=auth.middleware.js.map