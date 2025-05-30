import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';
import { hashPassword, comparePassword, generateToken, excludePassword } from '../utils/auth.utils';
import { RegisterUserInput, LoginInput, UpdateProfileInput, UpdateProfileImageInput } from '../models';

interface PrismaError extends Error {
  code?: string;
  meta?: unknown;
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
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
      diabetesType: "type1",
      minTargetGlucose: minTarget,
      maxTargetGlucose: maxTarget,
    };

    try {
      const user = await prisma.user.create({
        data: userData
      });

      console.log('[registerUser] User created successfully:', user.id);

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
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('[loginUser] Attempt login for email:', req.body.email);
  const { email, password }: LoginInput = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('[loginUser] User not found:', req.body.email);
    res.status(401);
    throw new Error('Invalid credentials');
  }

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

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  console.log('[getUserProfile] Fetching profile for user:', req.user.id);
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    console.log('[getUserProfile] User not found:', req.user.id);
    res.status(404);
    throw new Error('User not found');
  }

  console.log('[getUserProfile] Profile fetched successfully for user:', req.user.id);
  const userWithoutPassword = excludePassword(user);

  res.json({
    ...userWithoutPassword,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    medicalInfo: {
      diabetesType: "type1",
      diagnosisDate: user.diagnosisDate,
      treatingDoctor: user.treatingDoctor || 'No asignado',
    },
    profileImage: user.profileImage || null,
  });
});

export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  console.log('[updateUserProfile] Update request for user:', req.user.id);
  console.log('[updateUserProfile] Update data:', JSON.stringify(req.body, null, 2));
  const updateData: UpdateProfileInput = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    console.log('[updateUserProfile] User not found:', req.user.id);
    res.status(404);
    throw new Error('User not found');
  }

  console.log('[updateUserProfile] Updating user:', req.user.id);
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
  });

  console.log('[updateUserProfile] User updated successfully:', req.user.id);
  const userWithoutPassword = excludePassword(updatedUser);

  res.json({
    ...userWithoutPassword,
    name: `${updatedUser.firstName} ${updatedUser.lastName}`,
    email: updatedUser.email,
    medicalInfo: {
      diabetesType: "type1",
      diagnosisDate: updatedUser.diagnosisDate,
      treatingDoctor: updatedUser.treatingDoctor || 'No asignado',
    },
    profileImage: updatedUser.profileImage || null,
  });
});

export const updateGlucoseTarget = asyncHandler(async (req: Request, res: Response) => {
  console.log('[updateGlucoseTarget] Update request for user:', req.user.id);
  console.log('[updateGlucoseTarget] Target values:', JSON.stringify(req.body, null, 2));
  const { minTarget, maxTarget } = req.body;

  if (minTarget >= maxTarget || minTarget < 50 || maxTarget < 0 || maxTarget > 300) {
    console.log('[updateGlucoseTarget] Invalid target values:', { minTarget, maxTarget });
    res.status(400);
    throw new Error('Min target must be less than max target and both must be within valid ranges (min: 50, max: 300)');
  }

  const user = await prisma.user.update({
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
  res.json(user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  console.log('[deleteUser] Delete request for user:', req.user.id);
  
  try {
    await prisma.$transaction([
      prisma.glucoseReading.deleteMany({ where: { userId: req.user.id } }),
      prisma.activity.deleteMany({ where: { userId: req.user.id } }),
      prisma.meal.deleteMany({ where: { userId: req.user.id } }),
      prisma.insulinPrediction.deleteMany({ where: { userId: req.user.id } }),
      prisma.user.delete({ where: { id: req.user.id } }),
    ]);
    console.log('[deleteUser] User and related data deleted successfully:', req.user.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[deleteUser] Error deleting user:', error);
    throw error;
  }
});

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