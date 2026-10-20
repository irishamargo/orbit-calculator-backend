import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const SESSION_KEY_PREFIX = 'orbit:session:';

@Injectable()
export class OrbitSessionService implements OnModuleDestroy {
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

  async create(sessionId: string, userId: number): Promise<void> {
    await this.redis.set(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      String(userId),
      'EX',
      this.ttlSeconds,
    );
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const value = await this.redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);
    if (value === null) return null;

    const userId = Number(value);
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`${SESSION_KEY_PREFIX}${sessionId}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
