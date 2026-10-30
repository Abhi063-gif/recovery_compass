import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

// ─── Current User Decorator ───────────────────────────────────────────────────

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// ─── Roles Decorator ─────────────────────────────────────────────────────────

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ─── Public Route Decorator ───────────────────────────────────────────────────

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ─── Skip Throttle ───────────────────────────────────────────────────────────

export const SkipThrottle = () => SetMetadata('skipThrottle', true);

// ─── RequestId Decorator ─────────────────────────────────────────────────────

export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-request-id'] as string;
  },
);
