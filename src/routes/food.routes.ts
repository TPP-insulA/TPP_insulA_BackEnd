import { Router } from 'express';
import { processFoodImage } from '../controllers/food.controller';

const router = Router();
router.post('/process-image', processFoodImage);

export default router;