import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitKind = "login" | "register";

function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "rl:login",
      analytics: false,
    })
  : null;

const registerLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:register",
      analytics: false,
    })
  : null;

export async function getRequestIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || h.get("cf-connecting-ip")?.trim() || "unknown";
}

/**
 * Returns an error message when limited; null when allowed.
 * Missing Upstash env → allow (with error log in production) so deploy
 * without keys does not lock everyone out; set keys to enable limiting.
 */
export async function checkAuthRateLimit(
  kind: RateLimitKind,
  extraKey?: string,
): Promise<string | null> {
  const limiter = kind === "login" ? loginLimiter : registerLimiter;
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] UPSTASH_REDIS_REST_* not set — auth rate limit disabled");
    }
    return null;
  }

  const ip = await getRequestIp();
  const keys = [`ip:${ip}`];
  if (extraKey?.trim()) {
    keys.push(`${kind}:${extraKey.trim().toLowerCase()}`);
  }

  for (const key of keys) {
    const result = await limiter.limit(key);
    if (!result.success) {
      return "Too many attempts. Please try again in a minute.";
    }
  }

  return null;
}
