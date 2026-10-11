import redisClient, { isRedisAvailable } from '../config/redis.js';

/**
 * Get cached value by key
 */
export const getCache = async (key) => {
  if (!isRedisAvailable() || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`[Cache] Error reading key "${key}":`, err.message);
    return null;
  }
};

/**
 * Store value in cache with TTL in seconds
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isRedisAvailable() || !redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    console.warn(`[Cache] Error setting key "${key}":`, err.message);
    return false;
  }
};

/**
 * Delete a specific cached key
 */
export const deleteCache = async (key) => {
  if (!isRedisAvailable() || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn(`[Cache] Error deleting key "${key}":`, err.message);
    return false;
  }
};

/**
 * Invalidate keys matching a pattern (e.g. `user:123:*`)
 */
export const deleteCachePattern = async (pattern) => {
  if (!isRedisAvailable() || !redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (err) {
    console.warn(`[Cache] Error deleting pattern "${pattern}":`, err.message);
    return false;
  }
};

/**
 * Express middleware for response caching
 * @param {number} ttlSeconds - Time to live in seconds (default 5 minutes)
 * @param {string} prefix - Custom prefix for the cache key
 */
export const cacheMiddleware = (ttlSeconds = 300, prefix = 'cache') => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET' || !isRedisAvailable() || !redisClient) {
      return next();
    }

    const userId = req.user?.id || 'anon';
    const cacheKey = `${prefix}:${userId}:${req.originalUrl}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      res.setHeader('X-Cache', 'MISS');

      // Hook into res.json to cache response upon success
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // Fail-open: proceed without caching if an error occurs
      next();
    }
  };
};

/**
 * Add a JWT token to the blacklist
 */
export const blacklistToken = async (token, expiresInSeconds = 7 * 24 * 3600) => {
  if (!isRedisAvailable() || !redisClient) return false;
  try {
    await redisClient.set(`bl:${token}`, 'revoked', 'EX', expiresInSeconds);
    return true;
  } catch (err) {
    console.warn('[Cache] Error blacklisting token:', err.message);
    return false;
  }
};

/**
 * Check if a JWT token is in the blacklist
 */
export const isTokenBlacklisted = async (token) => {
  if (!isRedisAvailable() || !redisClient) return false;
  try {
    const result = await redisClient.get(`bl:${token}`);
    return Boolean(result);
  } catch (err) {
    console.warn('[Cache] Error checking blacklisted token:', err.message);
    return false;
  }
};
