"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedia = exports.uploadMedia = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const media_service_1 = require("../services/media.service");
exports.uploadMedia = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { type, file, mimeType } = req.body;
    const userId = req.user.id;
    if (!type || !file) {
        res.status(400);
        throw new Error('Type and file are required');
    }
    const buffer = Buffer.from(file.split(',')[1], 'base64');
    const timestamp = Date.now();
    const filename = `${type}_${userId}_${timestamp}`;
    try {
        const media = await media_service_1.MediaService.saveMedia({
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
    }
    catch (error) {
        console.error('Error saving media:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving media file'
        });
    }
});
exports.getMedia = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { type } = req.params;
    const userId = req.user.id;
    try {
        const media = await media_service_1.MediaService.getMediaByOriginalId(userId, type);
        if (!media) {
            res.status(404);
            throw new Error('Media not found');
        }
        res.json({
            success: true,
            data: media
        });
    }
    catch (error) {
        console.error('Error retrieving media:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving media file'
        });
    }
});
//# sourceMappingURL=media.controller.js.map