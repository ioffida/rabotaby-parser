/**
 * Structured application logs for support / AI-assisted debugging.
 * See DOCS/ERROR_LOGS.md for schema.
 */

export type LogSeverity = "info" | "warning" | "error";

export type AppLogPayload = {
  schemaVersion: 1;
  timestamp: string;
  source: string;
  severity: LogSeverity;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method?: string;
    url?: string;
    query?: Record<string, string | string[] | undefined>;
  };
  response?: {
    status?: number;
    statusText?: string;
    bodyPreview?: string;
  };
};

export function createAppLog(
  partial: Omit<AppLogPayload, "schemaVersion" | "timestamp"> &
    Partial<Pick<AppLogPayload, "schemaVersion" | "timestamp">>,
): AppLogPayload {
  return {
    schemaVersion: 1,
    timestamp: partial.timestamp ?? new Date().toISOString(),
    source: partial.source,
    severity: partial.severity,
    message: partial.message,
    context: partial.context,
    error: partial.error,
    request: partial.request,
    response: partial.response,
  };
}

export function serializeAppLog(payload: AppLogPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function truncateBody(text: string, max = 2048): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…[truncated ${text.length - max} chars]`;
}

export function errorToLogFields(err: unknown): AppLogPayload["error"] {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(err),
  };
}
