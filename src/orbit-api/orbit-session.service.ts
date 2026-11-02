import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { readFileSync } from 'node:fs';

const SESSION_KEY_PREFIX = 'orbit:session:';
const ACTIVE_SESSION_LOGINS_LUA = readFileSync(
  new URL('./lua/active-session-logins.lua', import.meta.url),
  'utf8',
);

@Injectable()
export class OrbitSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrbitSessionService.name);
  private readonly redis: Redis;
  readonly ttlSeconds: number;

  constructor(config: ConfigService) {
    const configuredTtl = Number(config.get('SESSION_TTL_SECONDS', 3600));
    this.ttlSeconds =
      Number.isSafeInteger(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : 3600;
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: Number(config.get('REDIS_PORT', 6379)),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', (error: Error) => {
      this.logger.error(`Не удалось подключиться к Redis: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.redis.status === 'wait') await this.redis.connect();
  }

  async create(sessionId: string, userId: number, login: string): Promise<void> {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const results = await this.redis
      .multi()
      .set(sessionKey, String(userId), 'EX', this.ttlSeconds)
      .set(`${sessionKey}:login`, login, 'EX', this.ttlSeconds)
      .exec();

    if (!results) throw new Error('Не удалось сохранить сессию в Redis');
    const failedCommand = results.find(([error]) => error !== null);
    if (failedCommand?.[0]) throw failedCommand[0];
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const value = await this.redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);
    if (value === null) return null;

    const userId = Number(value);
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  }

  async destroy(sessionId: string): Promise<void> {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    await this.redis.del(sessionKey, `${sessionKey}:login`);
  }

  async getActiveLogins(): Promise<string[]> {
    const result: unknown = await this.redis.eval(
      ACTIVE_SESSION_LOGINS_LUA,
      0,
      `${SESSION_KEY_PREFIX}*:login`,
      '100',
    );
    return Array.isArray(result)
      ? result.filter((login): login is string => typeof login === 'string')
      : [];
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
