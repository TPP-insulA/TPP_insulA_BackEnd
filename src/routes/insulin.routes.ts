import { Router } from 'express';
import {
  updateInsulinPrediction,
  deleteInsulinPrediction,
  calculateInsulinPrediction,
  getInsulinPredictions,
} from '../controllers/insulin.controller';
import { protect } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

/**
 * @swagger
 * tags:
 *   name: Insulin
 *   description: Insulin doses management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InsulinPrediction:
 *       type: object
 *       required:
 *         - date
 *         - cgmPrev
 *         - glucoseObjective
 *         - carbs
 *         - insulinOnBoard
 *         - sleepLevel
 *         - workLevel
 *         - activityLevel
 *         - recommendedDose
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the prediction
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the prediction
 *         cgmPrev:
 *           type: array
 *           items:
 *             type: number
 *           description: Previous CGM readings
 *         glucoseObjective:
 *           type: number
 *           description: Glucose target value
 *         carbs:
 *           type: number
 *           description: Carbohydrates intake
 *         insulinOnBoard:
 *           type: number
 *           description: Insulin on board
 *         sleepLevel:
 *           type: number
 *           description: Sleep level
 *         workLevel:
 *           type: number
 *           description: Work level
 *         activityLevel:
 *           type: number
 *           description: Activity level
 *         recommendedDose:
 *           type: number
 *           description: Recommended insulin dose
 *         applyDose:
 *           type: number
 *           nullable: true
 *           description: Actual dose applied (if any)
 *         cgmPost:
 *           type: array
 *           items:
 *             type: number
 *           description: CGM readings after dose (if any)
 */

/**
 * @swagger
 * /api/insulin/calculate:
 *   post:
 *     summary: Calcular y registrar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsulinPrediction'
 *     responses:
 *       200:
 *         description: Predicción de insulina calculada y registrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsulinPrediction'
 */

/**
 * @swagger
 * /api/insulin/predictions:
 *   get:
 *     summary: Obtener predicciones de insulina del usuario
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de predicciones de insulina
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InsulinPrediction'
 */

/**
 * @swagger
 * /api/insulin/{id}:
 *   put:
 *     summary: Actualizar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la predicción de insulina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applyDose:
 *                 type: number
 *                 description: Dosis aplicada
 *               cgmPost:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Lecturas CGM posteriores
 *     responses:
 *       200:
 *         description: Predicción de insulina actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applyDose:
 *                   type: number
 *                 cgmPost:
 *                   type: array
 *                   items:
 *                     type: number
 *   delete:
 *     summary: Eliminar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la predicción de insulina
 *     responses:
 *       200:
 *         description: Predicción de insulina eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

const router = Router();

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.use(protect);
router.use(apiLimiter);

/**
 * @swagger
 * /api/insulin/calculate:
 *   post:
 *     summary: Calcular y registrar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsulinPrediction'
 *     responses:
 *       200:
 *         description: Predicción de insulina calculada y registrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsulinPrediction'
 */
router.post('/calculate', calculateInsulinPrediction);

/**
 * @swagger
 * /api/insulin/predictions:
 *   get:
 *     summary: Obtener predicciones de insulina del usuario
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de predicciones de insulina
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InsulinPrediction'
 */
router.route('/predictions')
  .get(getInsulinPredictions)


/**
 * @swagger
 * /api/insulin/{id}:
 *   put:
 *     summary: Actualizar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la predicción de insulina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applyDose:
 *                 type: number
 *                 description: Dosis aplicada
 *               cgmPost:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Lecturas CGM posteriores
 *     responses:
 *       200:
 *         description: Predicción de insulina actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applyDose:
 *                   type: number
 *                 cgmPost:
 *                   type: array
 *                   items:
 *                     type: number
 *   delete:
 *     summary: Eliminar una predicción de insulina
 *     tags: [Insulin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la predicción de insulina
 *     responses:
 *       200:
 *         description: Predicción de insulina eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.put('/:id', protect, updateInsulinPrediction);
router.delete('/:id', protect, deleteInsulinPrediction);

export default router;