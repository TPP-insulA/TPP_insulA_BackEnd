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

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/image', protect, updateProfileImage);
router.put('/glucose-target', protect, updateGlucoseTarget);
router.delete('/', protect, deleteUser);

export default router;