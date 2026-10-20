import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { OrbitSessionService } from './orbit-session.service.js';

export type OrbitAuthenticatedRequest = Request & {
  orbitUserId?: number;
};

@Injectable()
export class OrbitSessionGuard implements CanActivate {
  constructor(private readonly sessions: OrbitSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OrbitAuthenticatedRequest>();
    const sessionId = request.cookies?.sessionId;
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    const userId = await this.sessions.getUserId(sessionId);
    if (userId === null)
      throw new UnauthorizedException('Сессия отсутствует или истекла');

    request.orbitUserId = userId;
    return true;
  }
}

@Injectable()
export class OptionalOrbitSessionGuard implements CanActivate {
  constructor(private readonly sessions: OrbitSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OrbitAuthenticatedRequest>();
    const sessionId = request.cookies?.sessionId;
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      request.orbitUserId =
        (await this.sessions.getUserId(sessionId)) ?? undefined;
    }
    return true;
  }
}
