import mongoose, { Schema } from 'mongoose';

const MediaSchema = new Schema({
    originalId: { type: String, required: true }, // ID from PostgreSQL (user, meal, or food ID)
    type: { type: String, required: true }, // 'profile', 'meal', 'food', 'plot'
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

MediaSchema.index({ originalId: 1, type: 1 });

export const Media = mongoose.model('Media', MediaSchema);