"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const Media_1 = require("../mongodb/models/Media");
class MediaService {
    static async saveMedia(data) {
        const media = new Media_1.Media(data);
        return await media.save();
    }
    static async getMediaByOriginalId(originalId, type) {
        return await Media_1.Media.findOne({ originalId, type });
    }
    static async updateMedia(originalId, type, updateData) {
        return await Media_1.Media.findOneAndUpdate({ originalId, type }, Object.assign(Object.assign({}, updateData), { updatedAt: new Date() }), { new: true });
    }
    static async deleteMedia(originalId, type) {
        return await Media_1.Media.findOneAndDelete({ originalId, type });
    }
}
exports.MediaService = MediaService;
//# sourceMappingURL=media.service.js.map