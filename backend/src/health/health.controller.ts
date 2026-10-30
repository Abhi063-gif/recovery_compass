import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

/**
 * Health Controller
 *
 * Provides liveness and readiness probes.
 * These endpoints are used by load balancers, container orchestrators,
 * and monitoring systems.
 *
 * - GET /api/health          → liveness probe (is the process alive?)
 * - GET /api/health/ready    → readiness probe (can we serve traffic?)
 * - GET /api/health/detailed → full dependency status (admin use)
 */
@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness probe — always returns 200 if the process is running.
   * Used by Kubernetes/Docker to determine if the container needs restart.
   */
  @Get()
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 if the process is alive.' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'recovery-compass-api',
      version: process.env.npm_package_version ?? '1.0.0',
    };
  }

  /**
   * Readiness probe — checks all dependencies before marking ready.
   * Used by load balancers to determine if the pod should receive traffic.
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe', description: 'Returns 200 when all dependencies are healthy.' })
  async readiness() {
    return this.healthService.getReadinessStatus();
  }

  /**
   * Detailed health check — full dependency status.
   * Returns status for database, Redis, and external AI services.
   * Intended for internal monitoring dashboards only.
   */
  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Returns detailed status for all dependencies. For internal monitoring use.',
  })
  async detailed() {
    return this.healthService.getDetailedStatus();
  }
}
