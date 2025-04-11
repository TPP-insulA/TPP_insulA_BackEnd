import { Router } from 'express';
import {
  getInsulinDoses,
  getInsulinDose,
  createInsulinDose,
  updateInsulinDose,
  deleteInsulinDose
} from '../controllers/insulin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getInsulinDoses)
  .post(createInsulinDose);

router.route('/:id')
  .get(getInsulinDose)
  .put(updateInsulinDose)
  .delete(deleteInsulinDose);

export default router;