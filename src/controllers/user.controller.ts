import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { hashPassword, comparePassword, generateToken, excludePassword } from '../utils/auth.utils';
import { RegisterUserInput, LoginInput, UpdateProfileInput, UpdateProfileImageInput } from '../models';

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
  console.log('[registerUser] Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request body:', req.body); // Log the entire body
  console.log('Request body.data:', req.body.data); // Log the data property
  const body = req.body.data ?? req.body;
  console.log('Selected body:', body); // Log what body is used

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
  }: RegisterUserInput = body;

  // Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  console.log('[registerUser] Creating new user with email:', email);
  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      birthDay: Number(birthDay),
      birthMonth: Number(birthMonth),
      birthYear: Number(birthYear),
      weight: Number(weight),
      height: Number(height),
      glucoseProfile,
    },
  });

  if (user) {
    console.log('[registerUser] User created successfully:', user.id);
    // Set glucose target values based on profile
    let minTarget = 70;
    let maxTarget = 180;
    
    switch (glucoseProfile) {
      case 'hypo':
        minTarget = 80; // Higher minimum for hypoglycemia-prone users
        maxTarget = 160; // Lower maximum for better control
        break;
      case 'hyper':
        minTarget = 100; // Higher minimum to avoid overcorrection
        maxTarget = 200; // Higher maximum for hyperglycemia-prone users
        break;
      case 'normal':
      default:
        // Use default values
        break;
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

    res.status(201).json({
      ...userWithoutPassword,
      token: generateToken(user.id),
    });
  } else {
    console.error('[registerUser] Failed to create user');
    res.status(400);
    throw new Error('Invalid user data');
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