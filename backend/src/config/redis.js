import Redis from 'ioredis';
import { config } from './index.js';

let redisClient = null;
let isConnected = false;

if (config.redisUrl && config.redisUrl.trim() !== '') {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('⚠️ Redis reconnection limit reached. Will retry intermittently.');
          return 5000;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('⚡ Redis connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('✅ Redis connected and ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.error('❌ Redis error:', err.message);
    });

    redisClient.on('close', () => {
      isConnected = false;
      console.log('🔌 Redis connection closed');
    });
  } catch (error) {
    console.error('❌ Failed to initialize Redis client:', error.message);
    redisClient = null;
    isConnected = false;
  }
} else {
  console.log('ℹ️ REDIS_URL not configured. Operating in local in-memory fallback mode.');
}

/**
 * Check if Redis is currently available and ready
 */
export const isRedisAvailable = () => {
  return Boolean(redisClient && isConnected);
};

/**
 * Get active Redis client
 */
export const getRedisClient = () => redisClient;

/**
 * Gracefully disconnect Redis
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis disconnected gracefully.');
    } catch (err) {
      console.error('Error disconnecting Redis:', err.message);
    }
  }
};

export default redisClient;
