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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateGlucoseTarget = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
const auth_utils_1 = require("../utils/auth.utils");
/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 */
exports.registerUser = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    // Check if user exists
    const userExists = yield app_1.prisma.user.findUnique({
        where: { email },
    });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    // Hash password
    const hashedPassword = yield (0, auth_utils_1.hashPassword)(password);
    // Create user
    const user = yield app_1.prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
        },
    });
    if (user) {
        // Create default glucose target
        yield app_1.prisma.glucoseTarget.create({
            data: {
                minTarget: 70,
                maxTarget: 180,
                userId: user.id,
            },
        });
        const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
        res.status(201).json(Object.assign(Object.assign({}, userWithoutPassword), { token: (0, auth_utils_1.generateToken)(user.id) }));
    }
    else {
        res.status(400);
        throw new Error('Invalid user data');
    }
}));
/**
 * Login user
 * @route POST /api/users/login
 * @access Public
 */
exports.loginUser = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Check if user exists
    const user = yield app_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        res.status(401);
        throw new Error('Invalid credentials');
    }
    // Check if password matches
    const isMatch = yield (0, auth_utils_1.comparePassword)(password, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { token: (0, auth_utils_1.generateToken)(user.id) }));
}));
/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getUserProfile = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield app_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            glucoseTarget: true,
        },
    });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(userWithoutPassword);
}));
/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateUserProfile = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield app_1.prisma.user.findUnique({
        where: { id: req.user.id },
    });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    // Update user fields
    const updatedUser = yield app_1.prisma.user.update({
        where: { id: req.user.id },
        data: {
            name: req.body.name || user.name,
            email: req.body.email || user.email,
            password: req.body.password ? yield (0, auth_utils_1.hashPassword)(req.body.password) : user.password,
        },
    });
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(updatedUser);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { token: (0, auth_utils_1.generateToken)(updatedUser.id) }));
}));
/**
 * Update user glucose target
 * @route PUT /api/users/glucose-target
 * @access Private
 */
exports.updateGlucoseTarget = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { minTarget, maxTarget } = req.body;
    if (minTarget >= maxTarget) {
        res.status(400);
        throw new Error('Min target must be less than max target');
    }
    const target = yield app_1.prisma.glucoseTarget.upsert({
        where: {
            userId: req.user.id
        },
        update: {
            minTarget,
            maxTarget,
        },
        create: {
            minTarget,
            maxTarget,
            userId: req.user.id,
        },
    });
    res.json(target);
}));
/**
 * Delete user account
 * @route DELETE /api/users
 * @access Private
 */
exports.deleteUser = (0, error_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Delete all related data
    yield app_1.prisma.$transaction([
        app_1.prisma.glucoseTarget.deleteMany({ where: { userId: req.user.id } }),
        app_1.prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
        app_1.prisma.activity.deleteMany({ where: { userId: req.user.id } }),
        app_1.prisma.insulinDose.deleteMany({ where: { userId: req.user.id } }),
        app_1.prisma.user.delete({ where: { id: req.user.id } }),
    ]);
    res.json({ message: 'User deleted' });
}));
