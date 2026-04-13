/**
 * Thrown when neither RABOTA_HH_USER_AGENT nor HH_USER_AGENT is set (HH API requires a descriptive UA).
 */
export class MissingHhUserAgentError extends Error {
  constructor() {
    super(
      "Set RABOTA_HH_USER_AGENT in .env.local (preferred), or HH_USER_AGENT — format: UniqueAppName/1.0 (your.name@gmail.com). If the IDE injects HH_USER_AGENT, use RABOTA_HH_USER_AGENT. See DOCS/USAGE.md.",
    );
    this.name = "MissingHhUserAgentError";
  }
}

/** Local validation failed before calling HH (template UA, example.com, etc.). */
export class InvalidUserAgentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserAgentConfigError";
  }
}

type HhErrorJson = {
  description?: string;
  errors?: Array<{ type?: string; value?: string }>;
};

/**
 * Build a readable message from HH JSON error body (e.g. bad_user_agent).
 */
export function formatHhApiFailureMessage(
  status: number,
  statusText: string,
  body: string,
): string {
  try {
    const j = JSON.parse(body) as HhErrorJson;
    const parts: string[] = [`HH API ${status}`];
    if (j.description) parts.push(j.description);
    if (j.errors?.length) {
      for (const e of j.errors) {
        if (e.type && e.value != null) parts.push(`${e.type}: ${e.value}`);
        else if (e.type) parts.push(e.type);
      }
    }
    if (parts.length === 1) parts.push(statusText);
    return parts.join(" — ");
  } catch {
    return `HH API ${status}: ${statusText}`;
  }
}
