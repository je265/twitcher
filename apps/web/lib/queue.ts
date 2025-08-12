import { Queue } from "bullmq";
import IORedis from "ioredis";

// Create Redis connection with better error handling
const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }
  
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
};

export const connection = createRedisConnection();

// Handle Redis connection events
connection.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

connection.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

connection.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

// Use standard BullMQ Queue instances
export const streamQueue = new Queue("stream-jobs", { connection });
export const videoProcessingQueue = new Queue("video-processing-jobs", { connection });
