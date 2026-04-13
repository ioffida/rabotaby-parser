import { createAppLog, errorToLogFields, truncateBody } from "@/lib/logger";
import { formatHhApiFailureMessage, MissingHhUserAgentError } from "@/lib/hh/errors";
import {
  assertUserAgentAcceptableForHh,
  normalizeUserAgent,
  readRawUserAgentFromEnv,
} from "@/lib/hh/userAgent";

const HH_BASE = "https://api.hh.ru";

export { MissingHhUserAgentError } from "@/lib/hh/errors";
export { InvalidUserAgentConfigError } from "@/lib/hh/errors";

function requireUserAgent(): string {
  const raw = readRawUserAgentFromEnv();
  if (!raw) throw new MissingHhUserAgentError();
  const ua = normalizeUserAgent(raw);
  assertUserAgentAcceptableForHh(ua);
  return ua;
}

export class HhApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly bodyPreview: string,
  ) {
    super(message);
    this.name = "HhApiError";
  }
}

type SearchParamValue =
  | string
  | number
  | boolean
  | string[]
  | undefined;

export async function hhFetchJson<T>(
  path: string,
  searchParams?: Record<string, SearchParamValue>,
  sourceForLog = "hhFetchJson",
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path, HH_BASE);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v === undefined || v === false || v === "") continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          const s = String(item).trim();
          if (s) url.searchParams.append(k, s);
        }
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const { headers: initHeaders, next: initNext, ...initRest } = init ?? {};
  const headers = new Headers(initHeaders as HeadersInit | undefined);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  headers.set("User-Agent", requireUserAgent());

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      ...initRest,
      headers,
      next: initNext ?? { revalidate: 0 },
    });
  } catch (e) {
    const log = createAppLog({
      source: sourceForLog,
      severity: "error",
      message: "Network error calling HeadHunter API",
      request: { method: "GET", url: url.toString() },
      error: errorToLogFields(e),
    });
    console.error(JSON.stringify(log));
    throw e;
  }

  const text = await res.text();
  if (!res.ok) {
    const log = createAppLog({
      source: sourceForLog,
      severity: "error",
      message: "HeadHunter API returned an error",
      request: { method: "GET", url: url.toString() },
      response: {
        status: res.status,
        statusText: res.statusText,
        bodyPreview: truncateBody(text),
      },
    });
    console.error(JSON.stringify(log));
    const detail = formatHhApiFailureMessage(res.status, res.statusText, text);
    throw new HhApiError(detail, res.status, truncateBody(text, 512));
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    const log = createAppLog({
      source: sourceForLog,
      severity: "error",
      message: "Invalid JSON from HeadHunter API",
      request: { method: "GET", url: url.toString() },
      response: { bodyPreview: truncateBody(text) },
      error: errorToLogFields(e),
    });
    console.error(JSON.stringify(log));
    throw e;
  }
}
