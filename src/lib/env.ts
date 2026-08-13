/** Ensure auth base URL has a protocol (Vercel often gets host-only values). */
export function normalizeAuthUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function applyAuthUrlEnv() {
  const normalized =
    normalizeAuthUrl(process.env.AUTH_URL) ??
    normalizeAuthUrl(process.env.NEXTAUTH_URL);

  if (normalized) {
    process.env.AUTH_URL = normalized;
    process.env.NEXTAUTH_URL = normalized;
  }
}
