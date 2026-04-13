import { InvalidUserAgentConfigError } from "@/lib/hh/errors";

/**
 * Prefer `RABOTA_HH_USER_AGENT`: IDEs/terminals often export `HH_USER_AGENT` globally
 * (e.g. test@example.com). Next.js does not override an env var that already exists in
 * the process environment, so `.env.local` values for `HH_USER_AGENT` may be ignored.
 */
export function readRawUserAgentFromEnv(): string | undefined {
  const fromProject = process.env.RABOTA_HH_USER_AGENT?.trim();
  if (fromProject) return fromProject;
  return process.env.HH_USER_AGENT?.trim();
}

/**
 * Trim .env quirks: BOM, wrapping quotes.
 */
export function normalizeUserAgent(raw: string): string {
  let u = raw.trim();
  if (u.charCodeAt(0) === 0xfeff) u = u.slice(1).trim();
  if (
    (u.startsWith('"') && u.endsWith('"')) ||
    (u.startsWith("'") && u.endsWith("'"))
  ) {
    u = u.slice(1, -1).trim();
  }
  return u;
}

/**
 * Reject obvious placeholders before calling api.hh.ru (HH often blacklists them).
 */
export function assertUserAgentAcceptableForHh(ua: string): void {
  if (ua.length < 12) {
    throw new InvalidUserAgentConfigError(
      "User-Agent is too short. Use: UniqueAppName/1.0 (your.email@yourdomain.com) in RABOTA_HH_USER_AGENT (see DOCS/USAGE.md).",
    );
  }

  const lower = ua.toLowerCase();

  if (!lower.includes("@")) {
    throw new InvalidUserAgentConfigError(
      "User-Agent must contain an email with @, e.g. MyParser/1.0 (you@gmail.com).",
    );
  }

  const forbiddenSubstrings = [
    "example.com",
    "example.org",
    "your-real-email",
    "your-email",
    "local-dev",
    "localhost",
    "@test.",
    "noreply@",
    "no-reply@",
  ];

  for (const bad of forbiddenSubstrings) {
    if (lower.includes(bad)) {
      throw new InvalidUserAgentConfigError(
        `User-Agent contains a known placeholder or tutorial fragment ("${bad}"). HH blacklists these — use your own app name and a real mailbox you read.`,
      );
    }
  }
}
