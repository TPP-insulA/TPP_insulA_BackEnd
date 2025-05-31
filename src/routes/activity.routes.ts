import { Router } from 'express';
import {
  getActivities,
} from '../controllers/activity.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Endpoints para consultar actividades físicas, comidas, insulina y glucosa del usuario.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - type
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: ID autogenerado de la actividad
 *         type:
 *           type: string
 *           enum: [glucose, meal, insulin]
 *           description: Tipo de actividad (glucosa, comida, insulina)
 *         value:
 *           type: number
 *           description: Valor asociado a la actividad (opcional)
 *         mealType:
 *           type: string
 *           description: Tipo de comida (si aplica)
 *         carbs:
 *           type: number
 *           description: Carbohidratos (si aplica)
 *         units:
 *           type: number
 *           description: Unidades de insulina (si aplica)
 *         notes:
 *           type: string
 *           description: Notas adicionales
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la actividad
 *         userId:
 *           type: string
 *           description: ID del usuario
 *         sourceId:
 *           type: string
 *           description: ID del modelo origen (GlucoseReading, Meal, InsulinPrediction)
 */

const router = Router();

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Obtener todas las actividades del usuario
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar actividades
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar actividades
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [glucose, meal, insulin]
 *         description: Filtrar por tipo de actividad
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Límite de resultados a devolver
 *     responses:
 *       200:
 *         description: Lista de actividades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 */
router.get('/', protect, getActivities);

export default router;