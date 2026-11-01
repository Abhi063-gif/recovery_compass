import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHealthRedisOptions } from './redis.config';
import { LoggerService } from '../common/logger/logger.service';

export interface RedisHealthResult {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class RedisHealthService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private isConnected = false;
  private hasWarnedUnavailable = false;
  private lastCheckTime = 0;
  private cachedHealth = false;
  private readonly checkIntervalMs = 5000;

  constructor(
    private readonly cfg: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(RedisHealthService.name);
  }

  async onModuleInit() {
    this.initClient();
  }

  private initClient() {
    if (this.client) return;

    try {
      const options = createHealthRedisOptions(this.cfg);
      this.client = new Redis(options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.hasWarnedUnavailable = false;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.hasWarnedUnavailable = false;
        this.logger.log('Redis ready to receive commands');
      });

      this.client.on('error', (err: any) => {
        this.isConnected = false;
        const msg = err?.message || err?.code || 'ECONNREFUSED';
        if (!this.hasWarnedUnavailable) {
          this.hasWarnedUnavailable = true;
          this.logger.warn(`Redis connection unavailable (${msg}). Recovery Compass is operating in resilient database-backed fallback mode.`);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.on('reconnecting', (ms: any) => {
        // Only log reconnect messages if we have not warned yet or at debug level
        if (!this.hasWarnedUnavailable) {
          this.logger.debug?.(`Redis reconnecting in ${ms}ms...`);
        }
      });

      // Try connecting lazily without throwing if unreachable
      this.client.connect().catch((err: any) => {
        this.isConnected = false;
        const msg = err?.message || err?.code || 'Connection is closed';
        if (!this.hasWarnedUnavailable) {
          this.hasWarnedUnavailable = true;
          this.logger.warn(`Redis initial connect failed (${msg}). System will use database fallback.`);
        }
      });
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(`Failed to initialize Redis health client: ${err.message}`);
    }
  }

  /**
   * Fast check if Redis is currently reachable.
   * Caches result for checkIntervalMs to avoid ping flooding.
   */
  async isAvailable(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheckTime < this.checkIntervalMs && this.cachedHealth) {
      return this.cachedHealth;
    }

    const health = await this.ping();
    this.lastCheckTime = now;
    this.cachedHealth = health.healthy;
    return health.healthy;
  }

  /**
   * Direct ping check with a 1500ms timeout
   */
  async ping(): Promise<RedisHealthResult> {
    if (!this.client) {
      this.initClient();
    }

    if (!this.client) {
      return { healthy: false, error: 'Redis client not initialized' };
    }

    const start = Date.now();
    try {
      const pingPromise = this.client.ping();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout (1500ms)')), 1500),
      );

      const res = await Promise.race([pingPromise, timeoutPromise]);
      const latency = Date.now() - start;

      if (res === 'PONG') {
        this.isConnected = true;
        return { healthy: true, latencyMs: latency };
      }
      return { healthy: false, latencyMs: latency, error: `Unexpected ping response: ${res}` };
    } catch (err: any) {
      this.isConnected = false;
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err.message || 'Redis ping failed',
      };
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

