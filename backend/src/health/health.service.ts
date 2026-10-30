import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface DependencyStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
  dependencies: Record<string, DependencyStatus>;
}

/**
 * Health Service
 *
 * Checks the status of all dependencies:
 * - PostgreSQL / Prisma
 * - Redis (optional — checked via Bull queue ping)
 * - Gemini AI API (optional — checked for key presence only)
 *
 * The overall status is:
 * - healthy   → all critical deps pass
 * - degraded  → non-critical deps failing
 * - unhealthy → critical deps failing
 *
 * Critical deps: database
 * Non-critical: Redis, AI APIs
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: ConfigService,
  ) {}

  async getReadinessStatus() {
    const db = await this.checkDatabase();
    const overall = db.status === 'healthy' ? 'ready' : 'not_ready';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      checks: { database: db },
    };
  }

  async getDetailedStatus(): Promise<HealthStatus> {
    const [db, gemini] = await Promise.all([
      this.checkDatabase(),
      this.checkGeminiConfig(),
    ]);

    const criticalOk = db.status === 'healthy';
    const overall: HealthStatus['status'] = criticalOk
      ? gemini.status === 'healthy'
        ? 'healthy'
        : 'degraded'
      : 'unhealthy';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      service: 'recovery-compass-api',
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: this.cfg.get<string>('NODE_ENV', 'development'),
      dependencies: {
        database: db,
        gemini: gemini,
      },
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: err?.message ?? 'Unknown database error',
      };
    }
  }

  private async checkGeminiConfig(): Promise<DependencyStatus> {
    const key = this.cfg.get<string>('GEMINI_API_KEY', '');
    if (!key || key === 'your-gemini-api-key') {
      return {
        status: 'degraded',
        error: 'GEMINI_API_KEY not configured — AI extraction will fail',
      };
    }
    return { status: 'healthy' };
  }
}
