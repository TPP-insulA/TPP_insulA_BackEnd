import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtener toda la data necesaria para el dashboard del usuario
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar lecturas de glucosa
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar lecturas de glucosa
 *     responses:
 *       200:
 *         description: Data del dashboard del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 glucoseReadings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlucoseReading'
 *                 userProfile:
 *                   $ref: '#/components/schemas/User'
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                 predictionHistory:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsulinPrediction'
 */
router.get('/', protect, getDashboardData);

export default router;
