import { Router } from 'express';
import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity
} from '../controllers/activity.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getActivities)
  .post(createActivity);

router.route('/:id')
  .get(getActivity)
  .put(updateActivity)
  .delete(deleteActivity);

export default router;