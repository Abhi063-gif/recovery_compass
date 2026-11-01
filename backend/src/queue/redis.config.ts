import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

/**
 * Redis & BullMQ Configuration Factory
 *
 * Requirements:
 * - Queue producers (HTTP request path): maxRetriesPerRequest: 1 (fast fail, bounded retries)
 * - Workers (BullMQ blocking commands): maxRetriesPerRequest: null (required by BullMQ)
 * - Reconnection with exponential backoff
 * - No ioredis keyPrefix (incompatible with BullMQ hash tags)
 * - Safe connection timeouts
 */

export interface ParsedRedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: boolean;
}

export function parseRedisUrl(urlStr: string): ParsedRedisConnection {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      db: url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : 0,
      tls: url.protocol === 'rediss:',
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      db: 0,
    };
  }
}

/**
 * Configuration for Queue Producers (e.g. DocumentsService, NotificationsService)
 * maxRetriesPerRequest is set to 1 so HTTP endpoints fail fast when Redis is down
 * rather than hanging and throwing MaxRetriesPerRequestError (20 retries).
 */
export function createProducerRedisOptions(cfg?: ConfigService): RedisOptions {
  const url = cfg?.get<string>('REDIS_URL') || process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = parseRedisUrl(url);

  return {
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    password: parsed.password,
    db: parsed.db,
    tls: parsed.tls ? {} : undefined,
    maxRetriesPerRequest: 1, // Bounded: fail fast on HTTP requests
    connectTimeout: 2000,     // 2s timeout
    enableOfflineQueue: false, // Don't buffer commands indefinitely
    lazyConnect: true,
    retryStrategy: (times: number) => {
      // Exponential backoff: fast initial retries, then relaxed to prevent socket flooding
      if (times > 10) {
        return 15000; // Check every 15s when persistently offline
      }
      return Math.min(times * 500, 5000);
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((target) => err.message.includes(target));
    },
  };
}

/**
 * Configuration for Workers and Bull Queues (e.g. Bull background processors).
 * maxRetriesPerRequest must be null for worker blocking connections.
 */
export function createWorkerRedisOptions(cfg?: ConfigService): RedisOptions {
  const url = cfg?.get<string>('REDIS_URL') || process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = parseRedisUrl(url);

  return {
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    password: parsed.password,
    db: parsed.db,
    tls: parsed.tls ? {} : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ / Bull for blocking commands
    connectTimeout: 5000,
    lazyConnect: true,
    retryStrategy: (times: number) => {
      return Math.min(times * 500, 5000);
    },
  };
}

/**
 * Lightweight, fast-fail configuration for Health Checks (RedisHealthService).
 * Uses maxRetriesPerRequest: 1 so HTTP health endpoints fail fast if Redis goes offline.
 */
export function createHealthRedisOptions(cfg?: ConfigService): RedisOptions {
  return createProducerRedisOptions(cfg);
}

