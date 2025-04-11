import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { hashPassword, comparePassword, generateToken, excludePassword } from '../utils/auth.utils';
import { RegisterUserInput, LoginInput } from '../models';

/**
 * Register a new user
 * @route POST /api/users/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
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
  }: RegisterUserInput = req.body;

  // Check if user exists
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

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

    const userWithoutPassword = excludePassword(user);

    res.status(201).json({
      ...userWithoutPassword,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * Login user
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const userWithoutPassword = excludePassword(user);

  res.json({
    ...userWithoutPassword,
    token: generateToken(user.id),
  });
});

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      glucoseTarget: true,
    },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const userWithoutPassword = excludePassword(user);

  res.json(userWithoutPassword);
});

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update user fields
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName: req.body.firstName || user.firstName,
      lastName: req.body.lastName || user.lastName,
      email: req.body.email || user.email,
      password: req.body.password ? await hashPassword(req.body.password) : user.password,
      birthDay: req.body.birthDay ? Number(req.body.birthDay) : user.birthDay,
      birthMonth: req.body.birthMonth ? Number(req.body.birthMonth) : user.birthMonth,
      birthYear: req.body.birthYear ? Number(req.body.birthYear) : user.birthYear,
      weight: req.body.weight ? Number(req.body.weight) : user.weight,
      height: req.body.height ? Number(req.body.height) : user.height,
      glucoseProfile: req.body.glucoseProfile || user.glucoseProfile,
    },
  });

  const userWithoutPassword = excludePassword(updatedUser);

  res.json({
    ...userWithoutPassword,
    token: generateToken(updatedUser.id),
  });
});

/**
 * Update user glucose target
 * @route PUT /api/users/glucose-target
 * @access Private
 */
export const updateGlucoseTarget = asyncHandler(async (req: Request, res: Response) => {
  const { minTarget, maxTarget } = req.body;

  if (minTarget >= maxTarget) {
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

  res.json(target);
});

/**
 * Delete user account
 * @route DELETE /api/users
 * @access Private
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  // Delete all related data
  await prisma.$transaction([
    prisma.glucoseTarget.deleteMany({ where: { userId: req.user.id } }),
    prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
    prisma.activity.deleteMany({ where: { userId: req.user.id } }),
    prisma.insulinDose.deleteMany({ where: { userId: req.user.id } }),
    prisma.user.delete({ where: { id: req.user.id } }),
  ]);

  res.json({ message: 'User deleted' });
});