import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Redis } from 'ioredis';

const script = await readFile(
  new URL('../src/orbit-api/lua/active-session-logins.lua', import.meta.url),
  'utf8',
);
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

try {
  await redis.connect();
  const logins = await redis.eval(
    script,
    0,
    'orbit:session:*:login',
    '100',
  );
  console.log('Логины с активными сессиями:', logins);
} finally {
  redis.disconnect();
}
