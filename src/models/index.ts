import { PrismaClient } from '@prisma/client';
import path from 'path';

// Definición de tipos basados en el esquema de Prisma
export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
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

export type InsulinDose = {
  id: string;
  units: number;
  glucoseLevel?: number | null;
  carbIntake?: number | null;
  timestamp: Date;
  userId: string;
}

// Auth types
export interface RegisterUserInput {
  email: string;
  name: string;
  password: string;
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

export interface CreateActivityInput {
  type: ActivityType;
  value?: number;
  mealType?: MealType;
  carbs?: number;
  units?: number;
}

// Insulin types
export interface CreateInsulinDoseInput {
  units: number;
  glucoseLevel?: number;
  carbIntake?: number;
}

// Exportar instancia de PrismaClient para usar en la aplicación
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  // Explicitly specify the path to the schema.prisma file
  __internal: {
    engine: {
      binaryPath: path.join(__dirname, '../../node_modules/.prisma/client/query-engine-windows.exe'),
      schemaPath: path.join(__dirname, '../../prisma/schema.prisma')
    }
  }
});