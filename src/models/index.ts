import { User, GlucoseTarget, GlucoseReading, Activity, InsulinDose } from '@prisma/client';

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

// Export Prisma types
export type {
  User,
  GlucoseTarget,
  GlucoseReading,
  Activity,
  InsulinDose
};