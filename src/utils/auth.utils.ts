import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 * @param {string} enteredPassword - Plain text password entered by user
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (
  enteredPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} - JWT token
 */
export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '30d',
  });
};

/**
 * Strip password from user object
 * @param {User} user - User object with password
 * @returns - User object without password
 */
export const excludePassword = (user: User) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};