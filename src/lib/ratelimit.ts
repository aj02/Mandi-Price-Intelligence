import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

let _publicLimiter: Ratelimit | null = null;

export function publicLimiter(): Ratelimit | null {
  if (_publicLimiter) return _publicLimiter;
  const r = getRedis();
  if (!r) return null;
  _publicLimiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: false,
    prefix: "mm:rl:pub",
  });
  return _publicLimiter;
}

export async function cacheJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const r = getRedis();
  if (!r) return loader();
  const hit = await r.get<T>(key).catch(() => null);
  if (hit !== null && hit !== undefined) return hit;
  const val = await loader();
  await r.set(key, val, { ex: ttlSeconds }).catch(() => null);
  return val;
}

export async function invalidatePrefix(prefix: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  let cursor = 0;
  do {
    const [next, keys] = await r.scan(cursor, { match: `${prefix}*`, count: 200 });
    if (keys.length) await r.del(...keys);
    cursor = Number(next);
  } while (cursor !== 0);
}
