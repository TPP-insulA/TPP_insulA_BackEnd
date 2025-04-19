"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileImage = exports.deleteUser = exports.updateGlucoseTarget = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
const auth_utils_1 = require("../utils/auth.utils");
exports.registerUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    try {
        console.log('[registerUser] Starting registration process');
        console.log('[registerUser] Raw request body:', JSON.stringify(req.body, null, 2));
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('[registerUser] Empty request body or parsing error');
            return res.status(400).json({
                success: false,
                message: 'Empty request body or JSON parsing error. Please check your request format.'
            });
        }
        const { email, password, firstName, lastName, birthDay, birthMonth, birthYear, weight, height, glucoseProfile } = req.body;
        const validationErrors = [];
        if (!email)
            validationErrors.push('email is required');
        if (!password)
            validationErrors.push('password is required');
        if (!firstName)
            validationErrors.push('firstName is required');
        if (!lastName)
            validationErrors.push('lastName is required');
        if (!birthDay)
            validationErrors.push('birthDay is required');
        if (!birthMonth)
            validationErrors.push('birthMonth is required');
        if (!birthYear)
            validationErrors.push('birthYear is required');
        if (!weight)
            validationErrors.push('weight is required');
        if (!height)
            validationErrors.push('height is required');
        if (!glucoseProfile)
            validationErrors.push('glucoseProfile is required');
        if (validationErrors.length > 0) {
            console.error('[registerUser] Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        const userExists = await app_1.prisma.user.findUnique({
            where: { email },
        });
        if (userExists) {
            console.log('[registerUser] User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        const hashedPassword = await (0, auth_utils_1.hashPassword)(password);
        console.log('[registerUser] Creating user with data:', {
            email,
            firstName,
            lastName,
            birthDay,
            birthMonth,
            birthYear,
            weight,
            height,
            glucoseProfile
        });
        const userData = {
            email: String(email),
            firstName: String(firstName),
            lastName: String(lastName),
            password: hashedPassword,
            birthDay: parseInt(String(birthDay)),
            birthMonth: parseInt(String(birthMonth)),
            birthYear: parseInt(String(birthYear)),
            weight: parseFloat(String(weight)),
            height: parseFloat(String(height)),
            glucoseProfile: String(glucoseProfile),
            diabetesType: "type1"
        };
        try {
            const user = await app_1.prisma.user.create({
                data: userData
            });
            console.log('[registerUser] User created successfully:', user.id);
            let minTarget = 70;
            let maxTarget = 180;
            switch (glucoseProfile) {
                case 'hypo':
                    minTarget = 80;
                    maxTarget = 160;
                    break;
                case 'hyper':
                    minTarget = 100;
                    maxTarget = 200;
                    break;
            }
            await app_1.prisma.glucoseTarget.create({
                data: {
                    minTarget,
                    maxTarget,
                    userId: user.id,
                },
            });
            console.log('[registerUser] Glucose target created for user:', user.id);
            const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
            return res.status(201).json({
                success: true,
                data: Object.assign(Object.assign({}, userWithoutPassword), { token: (0, auth_utils_1.generateToken)(user.id) })
            });
        }
        catch (dbError) {
            console.error('[registerUser] Database error:', dbError);
            throw new Error('Error creating user in database');
        }
    }
    catch (error) {
        console.error('[registerUser] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof Error && 'code' in error ? error.code : undefined,
            meta: error instanceof Error && 'meta' in error ? error.meta : undefined,
            stack: error instanceof Error ? error.stack : undefined
        });
        return res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
exports.loginUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[loginUser] Attempt login for email:', req.body.email);
    const { email, password } = req.body;
    const user = await app_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        console.log('[loginUser] User not found:', req.body.email);
        res.status(401);
        throw new Error('Invalid credentials');
    }
    const isMatch = await (0, auth_utils_1.comparePassword)(password, user.password);
    console.log('[loginUser] Password match result:', isMatch);
    if (!isMatch) {
        console.log('[loginUser] Invalid password for user:', req.body.email);
        res.status(401);
        throw new Error('Invalid credentials');
    }
    console.log('[loginUser] Login successful for user:', user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { token: (0, auth_utils_1.generateToken)(user.id) }));
});
exports.getUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[getUserProfile] Fetching profile for user:', req.user.id);
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            glucoseTarget: true,
        },
    });
    if (!user) {
        console.log('[getUserProfile] User not found:', req.user.id);
        res.status(404);
        throw new Error('User not found');
    }
    console.log('[getUserProfile] Profile fetched successfully for user:', req.user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { name: `${user.firstName} ${user.lastName}`, email: user.email, medicalInfo: {
            diabetesType: "type1",
            diagnosisDate: user.diagnosisDate,
            treatingDoctor: user.treatingDoctor || 'No asignado',
        }, profileImage: user.profileImage || null }));
});
exports.updateUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[updateUserProfile] Update request for user:', req.user.id);
    console.log('[updateUserProfile] Update data:', JSON.stringify(req.body, null, 2));
    const updateData = req.body;
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            glucoseTarget: true,
        },
    });
    if (!user) {
        console.log('[updateUserProfile] User not found:', req.user.id);
        res.status(404);
        throw new Error('User not found');
    }
    console.log('[updateUserProfile] Updating user:', req.user.id);
    const updatedUser = await app_1.prisma.user.update({
        where: { id: req.user.id },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (updateData.firstName && { firstName: updateData.firstName })), (updateData.lastName && { lastName: updateData.lastName })), (updateData.email && { email: updateData.email })), (updateData.password && { password: await (0, auth_utils_1.hashPassword)(updateData.password) })), (updateData.birthDay && { birthDay: updateData.birthDay })), (updateData.birthMonth && { birthMonth: updateData.birthMonth })), (updateData.birthYear && { birthYear: updateData.birthYear })), (updateData.weight && { weight: updateData.weight })), (updateData.height && { height: updateData.height })), (updateData.glucoseProfile && { glucoseProfile: updateData.glucoseProfile })), (updateData.profileImage && { profileImage: updateData.profileImage })), (updateData.treatingDoctor !== undefined && { treatingDoctor: updateData.treatingDoctor })), (updateData.diagnosisDate && { diagnosisDate: updateData.diagnosisDate })),
        include: {
            glucoseTarget: true,
        },
    });
    console.log('[updateUserProfile] User updated successfully:', req.user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(updatedUser);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { name: `${updatedUser.firstName} ${updatedUser.lastName}`, email: updatedUser.email, medicalInfo: {
            diabetesType: "type1",
            diagnosisDate: updatedUser.diagnosisDate,
            treatingDoctor: updatedUser.treatingDoctor || 'No asignado',
        }, profileImage: updatedUser.profileImage || null }));
});
exports.updateGlucoseTarget = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[updateGlucoseTarget] Update request for user:', req.user.id);
    console.log('[updateGlucoseTarget] Target values:', JSON.stringify(req.body, null, 2));
    const { minTarget, maxTarget } = req.body;
    if (minTarget >= maxTarget) {
        console.log('[updateGlucoseTarget] Invalid target values:', { minTarget, maxTarget });
        res.status(400);
        throw new Error('Min target must be less than max target');
    }
    const target = await app_1.prisma.glucoseTarget.upsert({
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
    console.log('[updateGlucoseTarget] Target updated successfully for user:', req.user.id);
    res.json(target);
});
exports.deleteUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[deleteUser] Delete request for user:', req.user.id);
    try {
        await app_1.prisma.$transaction([
            app_1.prisma.glucoseTarget.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.activity.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.insulinDose.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.user.delete({ where: { id: req.user.id } }),
        ]);
        console.log('[deleteUser] User and related data deleted successfully:', req.user.id);
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        console.error('[deleteUser] Error deleting user:', error);
        throw error;
    }
});
exports.updateProfileImage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[updateProfileImage] Update request for user:', req.user.id);
    console.log('[updateProfileImage] Image URL:', req.body.imageUrl);
    const { imageUrl } = req.body;
    if (!imageUrl) {
        console.log('[updateProfileImage] No image URL provided');
        res.status(400);
        throw new Error('Image URL is required');
    }
    const updatedUser = await app_1.prisma.user.update({
        where: { id: req.user.id },
        data: {
            profileImage: imageUrl
        },
    });
    console.log('[updateProfileImage] Profile image updated successfully for user:', req.user.id);
    res.json({
        success: true,
        profileImage: updatedUser.profileImage
    });
});
//# sourceMappingURL=user.controller.js.map