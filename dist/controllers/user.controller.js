"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileImage = exports.deleteUser = exports.updateGlucoseTarget = exports.updateUserProfile = exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const app_1 = require("../app");
const error_middleware_1 = require("../middleware/error.middleware");
const auth_utils_1 = require("../utils/auth.utils");
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const isValidPassword = (password) => {
    return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};
const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim());
};
const isValidDate = (day, month, year) => {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > currentYear) {
        return false;
    }
    const inputDate = new Date(year, month - 1, day);
    if (inputDate > currentDate) {
        return false;
    }
    if (inputDate.getDate() !== day || inputDate.getMonth() !== month - 1 || inputDate.getFullYear() !== year) {
        return false;
    }
    return true;
};
exports.registerUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    try {
        console.log('[registerUser] Starting registration process');
        console.log('[registerUser] Request IP:', req.ip);
        console.log('[registerUser] User-Agent:', req.get('User-Agent'));
        console.log('[registerUser] Content-Type:', req.get('Content-Type'));
        try {
            await app_1.prisma.$connect();
            console.log('[registerUser] Database connection successful');
        }
        catch (dbError) {
            console.error('[registerUser] Database connection failed:', dbError);
            return res.status(503).json({
                success: false,
                message: 'Database connection unavailable',
                error: 'DATABASE_UNAVAILABLE'
            });
        }
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('[registerUser] Empty request body');
            return res.status(400).json({
                success: false,
                message: 'Request body is empty',
                error: 'EMPTY_BODY'
            });
        }
        console.log('[registerUser] Raw request body:', JSON.stringify(req.body, null, 2));
        const { email, password, firstName, lastName, birthDay, birthMonth, birthYear, weight, height, glucoseProfile } = req.body;
        const validationErrors = [];
        if (!email) {
            validationErrors.push('Email is required');
        }
        else if (typeof email !== 'string') {
            validationErrors.push('Email must be a string');
        }
        else if (!isValidEmail(email.trim())) {
            validationErrors.push('Please provide a valid email address');
        }
        if (!password) {
            validationErrors.push('Password is required');
        }
        else if (typeof password !== 'string') {
            validationErrors.push('Password must be a string');
        }
        else if (!isValidPassword(password)) {
            validationErrors.push('Password must be at least 6 characters long and contain at least one letter and one number');
        }
        if (!firstName) {
            validationErrors.push('First name is required');
        }
        else if (typeof firstName !== 'string') {
            validationErrors.push('First name must be a string');
        }
        else if (!isValidName(firstName)) {
            validationErrors.push('First name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes');
        }
        if (!lastName) {
            validationErrors.push('Last name is required');
        }
        else if (typeof lastName !== 'string') {
            validationErrors.push('Last name must be a string');
        }
        else if (!isValidName(lastName)) {
            validationErrors.push('Last name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes');
        }
        if (birthDay === undefined || birthDay === null) {
            validationErrors.push('Birth day is required');
        }
        else if (!Number.isInteger(Number(birthDay))) {
            validationErrors.push('Birth day must be a valid integer');
        }
        if (birthMonth === undefined || birthMonth === null) {
            validationErrors.push('Birth month is required');
        }
        else if (!Number.isInteger(Number(birthMonth))) {
            validationErrors.push('Birth month must be a valid integer');
        }
        if (birthYear === undefined || birthYear === null) {
            validationErrors.push('Birth year is required');
        }
        else if (!Number.isInteger(Number(birthYear))) {
            validationErrors.push('Birth year must be a valid integer');
        }
        if (birthDay && birthMonth && birthYear) {
            const day = Number(birthDay);
            const month = Number(birthMonth);
            const year = Number(birthYear);
            if (!isValidDate(day, month, year)) {
                validationErrors.push('Please provide a valid birth date');
            }
            const today = new Date();
            const birthDate = new Date(year, month - 1, day);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 13) {
                validationErrors.push('User must be at least 13 years old');
            }
            if (age > 120) {
                validationErrors.push('Please provide a valid birth year');
            }
        }
        if (weight === undefined || weight === null) {
            validationErrors.push('Weight is required');
        }
        else if (isNaN(Number(weight))) {
            validationErrors.push('Weight must be a valid number');
        }
        else {
            const weightNum = Number(weight);
            if (weightNum <= 0 || weightNum > 1000) {
                validationErrors.push('Weight must be between 0.1 and 1000 kg');
            }
        }
        if (height === undefined || height === null) {
            validationErrors.push('Height is required');
        }
        else if (isNaN(Number(height))) {
            validationErrors.push('Height must be a valid number');
        }
        else {
            const heightNum = Number(height);
            if (heightNum <= 0 || heightNum > 300) {
                validationErrors.push('Height must be between 0.1 and 300 cm');
            }
        }
        if (!glucoseProfile) {
            validationErrors.push('Glucose profile is required');
        }
        else if (typeof glucoseProfile !== 'string') {
            validationErrors.push('Glucose profile must be a string');
        }
        else if (!['hypo', 'normal', 'hyper'].includes(glucoseProfile.toLowerCase())) {
            validationErrors.push('Glucose profile must be one of: hypo, normal, hyper');
        }
        if (validationErrors.length > 0) {
            console.error('[registerUser] Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors,
                error: 'VALIDATION_ERROR'
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        console.log('[registerUser] Checking if user exists:', normalizedEmail);
        try {
            const userExists = await app_1.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (userExists) {
                console.log('[registerUser] User already exists:', normalizedEmail);
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists',
                    error: 'USER_EXISTS'
                });
            }
        }
        catch (dbCheckError) {
            console.error('[registerUser] Error checking user existence:', dbCheckError);
            return res.status(500).json({
                success: false,
                message: 'Database error during user check',
                error: 'DATABASE_ERROR'
            });
        }
        console.log('[registerUser] Hashing password...');
        let hashedPassword;
        try {
            hashedPassword = await (0, auth_utils_1.hashPassword)(password);
        }
        catch (hashError) {
            console.error('[registerUser] Error hashing password:', hashError);
            return res.status(500).json({
                success: false,
                message: 'Error processing password',
                error: 'PASSWORD_HASH_ERROR'
            });
        }
        let minTarget = 70;
        let maxTarget = 180;
        switch (glucoseProfile.toLowerCase()) {
            case 'hypo':
                minTarget = 80;
                maxTarget = 160;
                break;
            case 'hyper':
                minTarget = 100;
                maxTarget = 200;
                break;
            default:
                minTarget = 70;
                maxTarget = 180;
                break;
        }
        console.log('[registerUser] Glucose targets set:', { minTarget, maxTarget, profile: glucoseProfile });
        const userData = {
            email: normalizedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            password: hashedPassword,
            birthDay: parseInt(String(birthDay)),
            birthMonth: parseInt(String(birthMonth)),
            birthYear: parseInt(String(birthYear)),
            weight: parseFloat(String(weight)),
            height: parseFloat(String(height)),
            glucoseProfile: glucoseProfile.toLowerCase(),
            diabetesType: "type1",
            minTargetGlucose: minTarget,
            maxTargetGlucose: maxTarget,
        };
        console.log('[registerUser] Creating user with data (password hidden):', Object.assign(Object.assign({}, userData), { password: '[HIDDEN]' }));
        let user;
        try {
            user = await app_1.prisma.user.create({
                data: userData
            });
            console.log('[registerUser] User created successfully:', user.id);
        }
        catch (createError) {
            console.error('[registerUser] Error creating user:', createError);
            if (createError instanceof Error) {
                const prismaError = createError;
                if (prismaError.code === 'P2002') {
                    return res.status(409).json({
                        success: false,
                        message: 'A user with this email already exists',
                        error: 'DUPLICATE_EMAIL'
                    });
                }
                if (prismaError.code === 'P2003') {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid foreign key constraint',
                        error: 'FOREIGN_KEY_ERROR'
                    });
                }
                if (prismaError.code === 'P2025') {
                    return res.status(400).json({
                        success: false,
                        message: 'Record not found',
                        error: 'RECORD_NOT_FOUND'
                    });
                }
            }
            return res.status(500).json({
                success: false,
                message: 'Database error during user creation',
                error: 'USER_CREATION_ERROR'
            });
        }
        const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
        let token;
        try {
            token = (0, auth_utils_1.generateToken)(user.id);
        }
        catch (tokenError) {
            console.error('[registerUser] Error generating token:', tokenError);
            return res.status(500).json({
                success: false,
                message: 'Error generating authentication token',
                error: 'TOKEN_GENERATION_ERROR'
            });
        }
        console.log('[registerUser] Registration completed successfully for user:', user.id);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: Object.assign(Object.assign({}, userWithoutPassword), { name: `${user.firstName} ${user.lastName}` }),
                token
            }
        });
    }
    catch (error) {
        console.error('[registerUser] Unexpected error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: error instanceof Error && 'code' in error ? error.code : undefined,
            meta: error instanceof Error && 'meta' in error ? error.meta : undefined,
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
        });
        return res.status(500).json(Object.assign({ success: false, message: 'Internal server error during user registration', error: 'INTERNAL_ERROR' }, (process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.message : 'Unknown error'
        })));
    }
});
exports.loginUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    try {
        console.log('[loginUser] Starting login process');
        console.log('[loginUser] Request IP:', req.ip);
        console.log('[loginUser] User-Agent:', req.get('User-Agent'));
        const { email, password } = req.body;
        const validationErrors = [];
        if (!email) {
            validationErrors.push('Email is required');
        }
        else if (typeof email !== 'string') {
            validationErrors.push('Email must be a string');
        }
        else if (!isValidEmail(email.trim())) {
            validationErrors.push('Please provide a valid email address');
        }
        if (!password) {
            validationErrors.push('Password is required');
        }
        else if (typeof password !== 'string') {
            validationErrors.push('Password must be a string');
        }
        if (validationErrors.length > 0) {
            console.log('[loginUser] Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors,
                error: 'VALIDATION_ERROR'
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        console.log('[loginUser] Attempting login for email:', normalizedEmail);
        const user = await app_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            console.log('[loginUser] User not found:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                error: 'INVALID_CREDENTIALS'
            });
        }
        console.log('[loginUser] User found, checking password for user:', user.id);
        const isMatch = await (0, auth_utils_1.comparePassword)(password, user.password);
        console.log('[loginUser] Password match result:', isMatch);
        if (!isMatch) {
            console.log('[loginUser] Invalid password for user:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                error: 'INVALID_CREDENTIALS'
            });
        }
        console.log('[loginUser] Login successful for user:', user.id);
        const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: Object.assign(Object.assign({}, userWithoutPassword), { name: `${user.firstName} ${user.lastName}` }),
                token: (0, auth_utils_1.generateToken)(user.id)
            }
        });
    }
    catch (error) {
        console.error('[loginUser] Error details:', error);
        return res.status(500).json(Object.assign({ success: false, message: 'Internal server error during login', error: 'INTERNAL_ERROR' }, (process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.message : 'Unknown error'
        })));
    }
});
exports.getUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[getUserProfile] Fetching profile for user:', req.user.id);
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.id },
    });
    if (!user) {
        console.log('[getUserProfile] User not found:', req.user.id);
        res.status(404);
        throw new Error('User not found');
    }
    console.log('[getUserProfile] Profile fetched successfully for user:', req.user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { name: `${user.firstName} ${user.lastName}` }));
});
exports.updateUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[updateUserProfile] Update request for user:', req.user.id);
    console.log('[updateUserProfile] Update data:', JSON.stringify(req.body, null, 2));
    const updateData = req.body;
    const user = await app_1.prisma.user.findUnique({
        where: { id: req.user.id },
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
    });
    console.log('[updateUserProfile] User updated successfully:', req.user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(updatedUser);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { name: `${updatedUser.firstName} ${updatedUser.lastName}` }));
});
exports.updateGlucoseTarget = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[updateGlucoseTarget] Update request for user:', req.user.id);
    console.log('[updateGlucoseTarget] Target values:', JSON.stringify(req.body, null, 2));
    const { minTarget, maxTarget } = req.body;
    if (minTarget >= maxTarget || minTarget < 50 || maxTarget < 0 || maxTarget > 300) {
        console.log('[updateGlucoseTarget] Invalid target values:', { minTarget, maxTarget });
        res.status(400);
        throw new Error('Min target must be less than max target and both must be within valid ranges (min: 50, max: 300)');
    }
    const user = await app_1.prisma.user.update({
        where: { id: req.user.id },
        data: {
            minTargetGlucose: minTarget,
            maxTargetGlucose: maxTarget,
        },
    });
    if (!user) {
        console.log('[updateGlucoseTarget] User not found:', req.user.id);
        res.status(404);
        throw new Error('User not found');
    }
    console.log('[updateGlucoseTarget] Target updated successfully for user:', req.user.id);
    const userWithoutPassword = (0, auth_utils_1.excludePassword)(user);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { name: `${user.firstName} ${user.lastName}` }));
});
exports.deleteUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log('[deleteUser] Delete request for user:', req.user.id);
    try {
        await app_1.prisma.$transaction([
            app_1.prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.activity.deleteMany({ where: { userId: req.user.id } }),
            app_1.prisma.meal.deleteMany({ where: { userId: req.user.id } }),
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