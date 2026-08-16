import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Bump this key whenever the DB adapter changes so HMR doesn't keep a stale client
// (old SQLite/libsql instance caused SQLITE_READONLY after migrating to Neon).
const globalForPrisma = globalThis as unknown as {
  prismaNeonHttpLogoSrc?: PrismaClient;
};

function sanitizeDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  if (raw.startsWith("file:") || /\bsqlite\b/i.test(raw)) {
    throw new Error(
      "DATABASE_URL đang trỏ SQLite. Hãy dùng Neon Postgres (postgresql://...).",
    );
  }

  const connectionString = sanitizeDatabaseUrl(raw);
  const adapter = new PrismaNeonHttp(connectionString, {
    arrayMode: false,
    fullResults: true,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prismaNeonHttpLogoSrc ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaNeonHttpLogoSrc = prisma;
}
