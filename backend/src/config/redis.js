import Redis from 'ioredis';
import config from './index.js';

let redisClient = null;
let redisConnected = false;

/* ========== CLIENT CREATION ========== */
const createRedisClient = () => {
  const options = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 5) return null; // Stop retrying
      return Math.min(times * 200, 2000);
    },
  };

  let client;
  if (process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL, options);
  } else {
    client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      ...options,
    });
  }

  client.on('connect', () => {
    redisConnected = true;
    // console.log('[REDIS] Connected');
  });

  client.on('error', (err) => {
    if (redisConnected) {
      // console.warn('[REDIS] Error:', err.message);
    }
    redisConnected = false;
  });

  client.on('close', () => {
    redisConnected = false;
  });

  return client;
};

/* ========== LAZY INIT ========== */
export const getRedisClient = () => {
  if (!redisClient) {
    try {
      redisClient = createRedisClient();
      redisClient.connect().catch(() => {
        // Silently fail — Redis is optional
        redisConnected = false;
      });
    } catch {
      redisConnected = false;
    }
  }
  return redisClient;
};

export const isRedisConnected = () => redisConnected;

/* ========== GENERIC CACHE HELPERS ========== */

/** Set a key with optional TTL (seconds) */
export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return false;
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch {
    return false;
  }
};

/** Get a cached value by key. Returns null if missing or on error. */
export const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return null;
    const val = await client.get(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  } catch {
    return null;
  }
};

/** Delete a key */
export const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return false;
    await client.del(key);
    return true;
  } catch {
    return false;
  }
};

/** Increment a counter (for rate limiting, etc.) */
export const cacheIncr = async (key, ttlSeconds = 60) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return 0;
    const val = await client.incr(key);
    if (val === 1) await client.expire(key, ttlSeconds);
    return val;
  } catch {
    return 0;
  }
};

/* ========== SESSION STORE ========== */
const SESSION_PREFIX = 'edyra:session:';
const SESSION_TTL = 24 * 60 * 60; // 24 hours

/** Store session data in Redis */
export const createSession = async (sessionId, data) => {
  return cacheSet(`${SESSION_PREFIX}${sessionId}`, data, SESSION_TTL);
};

/** Retrieve session data from Redis */
export const getSession = async (sessionId) => {
  return cacheGet(`${SESSION_PREFIX}${sessionId}`);
};

/** Delete a session (logout) */
export const deleteSession = async (sessionId) => {
  return cacheDel(`${SESSION_PREFIX}${sessionId}`);
};

/** Refresh session TTL on activity */
export const refreshSession = async (sessionId) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return false;
    await client.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL);
    return true;
  } catch {
    return false;
  }
};

/** Delete ALL sessions for a user (force logout from all devices) */
export const deleteAllUserSessions = async (userId) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return false;
    const keys = await client.keys(`${SESSION_PREFIX}*`);
    const deletions = [];
    for (const key of keys) {
      const data = await cacheGet(key.replace(SESSION_PREFIX, '') ? key : `__${key}`);
      const raw = await client.get(key);
      let parsed;
      try { parsed = JSON.parse(raw); } catch { continue; }
      if (parsed?.userId === userId.toString()) {
        deletions.push(client.del(key));
      }
    }
    await Promise.allSettled(deletions);
    return true;
  } catch {
    return false;
  }
};

/* ========== RATE LIMIT STORE ========== */
const RATE_PREFIX = 'edyra:rate:';

export const rateLimitCheck = async (key, maxRequests, windowSeconds) => {
  const fullKey = `${RATE_PREFIX}${key}`;
  const count = await cacheIncr(fullKey, windowSeconds);
  return {
    allowed: count <= maxRequests,
    count,
    remaining: Math.max(0, maxRequests - count),
  };
};

/* ========== NOTIFICATION STORE ========== */
const NOTIF_PREFIX = 'edyra:notif:';
const NOTIF_TTL = 7 * 24 * 60 * 60; // 7 days

export const pushNotification = async (userId, notification) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return false;
    const key = `${NOTIF_PREFIX}${userId}`;
    const notif = JSON.stringify({ ...notification, id: Date.now(), createdAt: new Date() });
    await client.lpush(key, notif);
    await client.ltrim(key, 0, 49);  // Keep last 50 notifications
    await client.expire(key, NOTIF_TTL);
    return true;
  } catch {
    return false;
  }
};

export const getNotifications = async (userId, limit = 20) => {
  try {
    const client = getRedisClient();
    if (!redisConnected) return [];
    const key = `${NOTIF_PREFIX}${userId}`;
    const items = await client.lrange(key, 0, limit - 1);
    return items.map(i => { try { return JSON.parse(i); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
};

export default {
  getRedisClient,
  isRedisConnected,
  cacheSet,
  cacheGet,
  cacheDel,
  cacheIncr,
  createSession,
  getSession,
  deleteSession,
  refreshSession,
  deleteAllUserSessions,
  rateLimitCheck,
  pushNotification,
  getNotifications,
};