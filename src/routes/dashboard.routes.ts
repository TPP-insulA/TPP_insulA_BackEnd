import { Router } from 'express';
import { getDashboardData, chatWithAI } from '../controllers/dashboard.controller';
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

/**
 * @swagger
 * /api/dashboard/chat:
 *   post:
 *     summary: Obtener respuesta de Gemini AI para el chat
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de mensajes del usuario
 *     responses:
 *       200:
 *         description: Respuesta cruda de Gemini AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/chat', protect, chatWithAI);

export default router;
