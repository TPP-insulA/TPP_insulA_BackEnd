import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { MediaService } from '../services/media.service';

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
    const { type, file, mimeType } = req.body;
    const userId = req.user.id;

    if (!type || !file) {
        res.status(400);
        throw new Error('Type and file are required');
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(file.split(',')[1], 'base64');
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `${type}_${userId}_${timestamp}`;

    try {
        const media = await MediaService.saveMedia({
            originalId: userId,
            type,
            url: file,
            filename,
            mimeType: mimeType || 'image/jpeg'
        });

        res.status(201).json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Error saving media:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving media file'
        });
    }
});

export const getMedia = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const userId = req.user.id;

    try {
        const media = await MediaService.getMediaByOriginalId(userId, type);
        if (!media) {
            res.status(404);
            throw new Error('Media not found');
        }

        res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Error retrieving media:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving media file'
        });
    }
});