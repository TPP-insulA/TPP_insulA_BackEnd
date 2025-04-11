import { Router } from 'express';
import {
  getGlucoseReadings,
  getGlucoseReading,
  createGlucoseReading,
  updateGlucoseReading,
  deleteGlucoseReading
} from '../controllers/glucose.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getGlucoseReadings)
  .post(createGlucoseReading);

router.route('/:id')
  .get(getGlucoseReading)
  .put(updateGlucoseReading)
  .delete(deleteGlucoseReading);

export default router;