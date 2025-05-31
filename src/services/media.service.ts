import { Media } from '../mongodb/models/Media';

export class MediaService {
    static async saveMedia(data: {
        originalId: string;
        type: 'profile' | 'meal' | 'food' | 'plot';
        url: string;
        filename: string;
        mimeType: string;
    }) {
        const media = new Media(data);
        return await media.save();
    }

    static async getMediaByOriginalId(originalId: string, type: string) {
        return await Media.findOne({ originalId, type });
    }

    static async updateMedia(originalId: string, type: string, updateData: Partial<{
        url: string;
        filename: string;
        mimeType: string;
    }>) {
        return await Media.findOneAndUpdate(
            { originalId, type },
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );
    }

    static async deleteMedia(originalId: string, type: string) {
        return await Media.findOneAndDelete({ originalId, type });
    }
}