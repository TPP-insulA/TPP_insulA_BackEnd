import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  updateGlucoseTarget,
  deleteUser
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: User email
 *         name:
 *           type: string
 *           description: User full name
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         diabetesType:
 *           type: integer
 *           enum: [1, 2]
 *           description: Type of diabetes (1 or 2)
 *         targetGlucoseMin:
 *           type: number
 *           description: Minimum target glucose level
 *         targetGlucoseMax:
 *           type: number
 *           description: Maximum target glucose level
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const router = Router();

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
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               diabetesType:
 *                 type: integer
 *                 enum: [1, 2]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/register', registerUser);

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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

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
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               diabetesType:
 *                 type: integer
 *                 enum: [1, 2]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

/**
 * @swagger
 * /api/users/profile/image:
 *   put:
 *     summary: Update profile image
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
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/profile/image', protect, updateProfileImage);

/**
 * @swagger
 * /api/users/glucose-target:
 *   put:
 *     summary: Update glucose target range
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
 *               - targetGlucoseMin
 *               - targetGlucoseMax
 *             properties:
 *               targetGlucoseMin:
 *                 type: number
 *               targetGlucoseMax:
 *                 type: number
 *     responses:
 *       200:
 *         description: Glucose target updated successfully
 *       401:
 *         description: Not authorized
 */
router.put('/glucose-target', protect, updateGlucoseTarget);

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
 *         description: User account deleted successfully
 *       401:
 *         description: Not authorized
 */
router.delete('/', protect, deleteUser);

export default router;