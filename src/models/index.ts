// Type definitions for the application
import { prisma } from '../app';

// Definición de tipos basados en el esquema de Prisma
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  weight: number;
  height: number;
  glucoseProfile: string;
  profileImage?: string | null;
  diabetesType: string;
  diagnosisDate: Date;
  treatingDoctor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GlucoseTarget = {
  id: string;
  minTarget: number;
  maxTarget: number;
  userId: string;
}

export type GlucoseReading = {
  id: string;
  value: number;
  timestamp: Date;
  notes?: string | null;
  userId: string;
}

export type Activity = {
  id: string;
  type: string;
  value?: number | null;
  mealType?: string | null;
  carbs?: number | null;
  units?: number | null;
  timestamp: Date;
  userId: string;
}

// Auth types
export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  weight: number;
  height: number;
  glucoseProfile: 'hypo' | 'normal' | 'hyper';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// User types
export type UserWithoutPassword = Omit<User, 'password'>;

// Glucose types
export interface CreateGlucoseReadingInput {
  value: number;
  notes?: string;
}

export interface UpdateGlucoseTargetInput {
  minTarget: number;
  maxTarget: number;
}

// Activity types
export type ActivityType = 'glucose' | 'meal' | 'insulin';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';


// Profile types
export interface UpdateProfileInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  weight?: number;
  height?: number;
  glucoseProfile?: string;
  profileImage?: string;
  treatingDoctor?: string;
  diagnosisDate?: Date;
}

export interface UpdateProfileImageInput {
  imageUrl: string;
}

//Insulin types
export interface InsulinPredictionData {
  date: string; // UTC ISO string
  cgmPrev: number[];
  glucoseObjective: number;
  carbs: number;
  insulinOnBoard: number;
  sleepLevel: number;
  workLevel: number;
  activityLevel: number;
}

export interface InsulinPredictionResult extends InsulinPredictionData {
  id: string;
  recommendedDose: number;
  applyDose?: number;
  cgmPost: number[];
}

// Re-export prisma instance from app.ts
export { prisma };