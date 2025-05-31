import { Router } from 'express';
import { uploadMedia, getMedia } from '../controllers/media.controller';
import { protect } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media file management (photos, plots)
 */

const router = Router();

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload a media file (photo or plot)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - file
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [profile, meal, plot]
 *               file:
 *                 type: string
 *                 description: Base64 encoded file
 *               mimeType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 */
router.post('/upload', protect, uploadMedia);

/**
 * @swagger
 * /api/media/{type}:
 *   get:
 *     summary: Get media by type
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [profile, meal, plot]
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 */
router.get('/:type', protect, getMedia);

export default router;