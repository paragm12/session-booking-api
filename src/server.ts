import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down...`);
      server.close();
      await disconnectDB();
      process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void start();
