import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { hashPassword, comparePassword, generateToken, excludePassword } from '../utils/auth.utils';
import { RegisterUserInput, LoginInput, UpdateProfileInput, UpdateProfileImageInput } from '../models';

interface PrismaError extends Error {
  code?: string;
  meta?: unknown;
}

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - birthDay
 *               - birthMonth
 *               - birthYear
 *               - weight
 *               - height
 *               - glucoseProfile
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *               birthMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               birthYear:
 *                 type: integer
 *                 minimum: 1900
 *               weight:
 *                 type: number
 *                 description: Weight in kilograms
 *               height:
 *                 type: number
 *                 description: Height in centimeters
 *               glucoseProfile:
 *                 type: string
 *                 enum: [hypo, normal, hyper]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: User already exists or invalid data
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('[registerUser] Starting registration process');
    console.log('[registerUser] Raw request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      birthDay, 
      birthMonth, 
      birthYear, 
      weight, 
      height,
      glucoseProfile 
    } = req.body;

    // Enhanced validation with detailed error messages
    const validationErrors = [];
    if (!email) validationErrors.push('email is required');
    if (!password) validationErrors.push('password is required');
    if (!firstName) validationErrors.push('firstName is required');
    if (!lastName) validationErrors.push('lastName is required');
    if (!birthDay) validationErrors.push('birthDay is required');
    if (!birthMonth) validationErrors.push('birthMonth is required');
    if (!birthYear) validationErrors.push('birthYear is required');
    if (!weight) validationErrors.push('weight is required');
    if (!height) validationErrors.push('height is required');
    if (!glucoseProfile) validationErrors.push('glucoseProfile is required');

    if (validationErrors.length > 0) {
      console.error('[registerUser] Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      console.log('[registerUser] User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

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

    // Create user with explicit data validation
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
      const user = await prisma.user.create({
        data: userData
      });

      console.log('[registerUser] User created successfully:', user.id);

      // Set glucose target values
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
        // normal uses default values
      }

      // Create glucose target
      await prisma.glucoseTarget.create({
        data: {
          minTarget,
          maxTarget,
          userId: user.id,
        },
      });

      console.log('[registerUser] Glucose target created for user:', user.id);

      const userWithoutPassword = excludePassword(user);
      
      return res.status(201).json({
        success: true,
        data: {
          ...userWithoutPassword,
          token: generateToken(user.id)
        }
      });
    } catch (dbError) {
      console.error('[registerUser] Database error:', dbError);
      throw new Error('Error creating user in database');
    }

  } catch (error: unknown) {
    console.error('[registerUser] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as PrismaError).code : undefined,
      meta: error instanceof Error && 'meta' in error ? (error as PrismaError).meta : undefined,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('[loginUser] Attempt login for email:', req.body.email);
  const { email, password }: LoginInput = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('[loginUser] User not found:', req.body.email);
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isMatch = await comparePassword(password, user.password);
  console.log('[loginUser] Password match result:', isMatch);

  if (!isMatch) {
    console.log('[loginUser] Invalid password for user:', req.body.email);
    res.status(401);
    throw new Error('Invalid credentials');
  }

  console.log('[loginUser] Login successful for user:', user.id);
  const userWithoutPassword = excludePassword(user);

  res.json({
    ...userWithoutPassword,
    token: generateToken(user.id),
  });
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 birthDay:
 *                   type: integer
 *                 birthMonth:
 *                   type: integer
 *                 birthYear:
 *                   type: integer
 *                 weight:
 *                   type: number
 *                 height:
 *                   type: number
 *                 glucoseProfile:
 *                   type: string
 *                 glucoseTarget:
 *                   type: object
 *                   properties:
 *                     minTarget:
 *                       type: number
 *                     maxTarget:
 *                       type: number
 *       404:
 *         description: User not found
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  console.log('[getUserProfile] Fetching profile for user:', req.user.id);
  const user = await prisma.user.findUnique({
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
  const userWithoutPassword = excludePassword(user);

  // Format the response to match frontend expectations
  res.json({
    ...userWithoutPassword,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    medicalInfo: {
      diabetesType: "type1", // Always type1 for this app
      diagnosisDate: user.diagnosisDate,
      treatingDoctor: user.treatingDoctor || 'No asignado',
    },
    profileImage: user.profileImage || null,
  });
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDay:
 *                 type: integer
 *               birthMonth:
 *                 type: integer
 *               birthYear:
 *                 type: integer
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               glucoseProfile:
 *                 type: string
 *                 enum: [hypo, normal, hyper]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  console.log('[updateUserProfile] Update request for user:', req.user.id);
  console.log('[updateUserProfile] Update data:', JSON.stringify(req.body, null, 2));
  const updateData: UpdateProfileInput = req.body;

  const user = await prisma.user.findUnique({
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
  // Update user fields
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(updateData.firstName && { firstName: updateData.firstName }),
      ...(updateData.lastName && { lastName: updateData.lastName }),
      ...(updateData.email && { email: updateData.email }),
      ...(updateData.password && { password: await hashPassword(updateData.password) }),
      ...(updateData.birthDay && { birthDay: updateData.birthDay }),
      ...(updateData.birthMonth && { birthMonth: updateData.birthMonth }),
      ...(updateData.birthYear && { birthYear: updateData.birthYear }),
      ...(updateData.weight && { weight: updateData.weight }),
      ...(updateData.height && { height: updateData.height }),
      ...(updateData.glucoseProfile && { glucoseProfile: updateData.glucoseProfile }),
      ...(updateData.profileImage && { profileImage: updateData.profileImage }),
      ...(updateData.treatingDoctor !== undefined && { treatingDoctor: updateData.treatingDoctor }),
      ...(updateData.diagnosisDate && { diagnosisDate: updateData.diagnosisDate }),
    },
    include: {
      glucoseTarget: true,
    },
  });

  console.log('[updateUserProfile] User updated successfully:', req.user.id);
  const userWithoutPassword = excludePassword(updatedUser);

  // Format the response to match frontend expectations
  res.json({
    ...userWithoutPassword,
    name: `${updatedUser.firstName} ${updatedUser.lastName}`,
    email: updatedUser.email,
    medicalInfo: {
      diabetesType: "type1", // Always type1 for this app
      diagnosisDate: updatedUser.diagnosisDate,
      treatingDoctor: updatedUser.treatingDoctor || 'No asignado',
    },
    profileImage: updatedUser.profileImage || null,
  });
});

/**
 * @swagger
 * /api/users/glucose-target:
 *   put:
 *     summary: Update user glucose target
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - minTarget
 *               - maxTarget
 *             properties:
 *               minTarget:
 *                 type: number
 *               maxTarget:
 *                 type: number
 *     responses:
 *       200:
 *         description: Glucose target updated successfully
 *       400:
 *         description: Invalid target values
 */
export const updateGlucoseTarget = asyncHandler(async (req: Request, res: Response) => {
  console.log('[updateGlucoseTarget] Update request for user:', req.user.id);
  console.log('[updateGlucoseTarget] Target values:', JSON.stringify(req.body, null, 2));
  const { minTarget, maxTarget } = req.body;

  if (minTarget >= maxTarget) {
    console.log('[updateGlucoseTarget] Invalid target values:', { minTarget, maxTarget });
    res.status(400);
    throw new Error('Min target must be less than max target');
  }

  const target = await prisma.glucoseTarget.upsert({
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

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('[deleteUser] Delete request for user:', req.user.id);
  
  try {
    await prisma.$transaction([
      prisma.glucoseTarget.deleteMany({ where: { userId: req.user.id } }),
      prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
      prisma.activity.deleteMany({ where: { userId: req.user.id } }),
      prisma.insulinDose.deleteMany({ where: { userId: req.user.id } }),
      prisma.user.delete({ where: { id: req.user.id } }),
    ]);
    console.log('[deleteUser] User and related data deleted successfully:', req.user.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[deleteUser] Error deleting user:', error);
    throw error;
  }
});

/**
 * @swagger
 * /api/users/profile/image:
 *   put:
 *     summary: Update user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the uploaded profile image
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       404:
 *         description: User not found
 */
export const updateProfileImage = asyncHandler(async (req: Request, res: Response) => {
  console.log('[updateProfileImage] Update request for user:', req.user.id);
  console.log('[updateProfileImage] Image URL:', req.body.imageUrl);
  const { imageUrl } = req.body as UpdateProfileImageInput;

  if (!imageUrl) {
    console.log('[updateProfileImage] No image URL provided');
    res.status(400);
    throw new Error('Image URL is required');
  }

  const updatedUser = await prisma.user.update({
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