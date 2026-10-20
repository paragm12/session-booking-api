import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
