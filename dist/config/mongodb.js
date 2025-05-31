"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectMongoDB = async () => {
    try {
        const mongoURL = "mongodb://mongo:NnWeiIphGHLFMOKuLzoHQsQPWPjeEZVE@metro.proxy.rlwy.net:50552";
        await mongoose_1.default.connect(mongoURL, {
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            minPoolSize: 5
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose_1.default.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });
        console.log('Database mongodb connection established');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};
exports.connectMongoDB = connectMongoDB;
//# sourceMappingURL=mongodb.js.map