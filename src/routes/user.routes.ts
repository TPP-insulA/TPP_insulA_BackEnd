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
 *                 description: User's email address
 *                 example: "francisco@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Password (at least 6 characters, must contain letters and numbers)
 *                 example: "Franfran123"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 description: User's first name
 *                 example: "Francisco"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 description: User's last name
 *                 example: "Duca"
 *               birthDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *                 description: Day of birth
 *                 example: 10
 *               birthMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Month of birth
 *                 example: 5
 *               birthYear:
 *                 type: integer
 *                 minimum: 1900
 *                 description: Year of birth
 *                 example: 1995
 *               weight:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: User's weight in kg
 *                 example: 60
 *               height:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 300
 *                 description: User's height in cm
 *                 example: 165
 *               glucoseProfile:
 *                 type: string
 *                 enum: [hypo, normal, hyper]
 *                 description: User's glucose profile
 *                 example: "normal"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Email is required", "Password must be at least 6 characters"]
 *                 error:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "A user with this email already exists"
 *                 error:
 *                   type: string
 *                   example: "USER_EXISTS"
 *       500:
 *         description: Internal server error
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
 *                 format: email
 *                 description: User's email address
 *                 example: "francisco@example.com"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "Franfran123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
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