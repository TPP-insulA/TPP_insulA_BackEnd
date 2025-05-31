import mongoose from 'mongoose';

export const connectMongoDB = async () => {
    try {
        const mongoURL = "mongodb://mongo:NnWeiIphGHLFMOKuLzoHQsQPWPjeEZVE@metro.proxy.rlwy.net:50552";

        await mongoose.connect(mongoURL, {
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            minPoolSize: 5
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        console.log('Database mongodb connection established');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};