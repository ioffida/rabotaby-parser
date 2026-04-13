import { NextResponse } from "next/server";

import { HhApiError } from "@/lib/hh/client";
import {
  InvalidUserAgentConfigError,
  MissingHhUserAgentError,
} from "@/lib/hh/errors";
import {
  createAppLog,
  errorToLogFields,
  serializeAppLog,
  truncateBody,
} from "@/lib/logger";

/**
 * Map HH / config failures to HTTP JSON for route handlers.
 */
export function nextResponseFromHhFailure(
  source: string,
  e: unknown,
  context?: Record<string, unknown>,
): NextResponse {
  if (e instanceof InvalidUserAgentConfigError) {
    const log = createAppLog({
      source,
      severity: "error",
      message: e.message,
      error: errorToLogFields(e),
      context,
    });
    console.error(serializeAppLog(log));
    return NextResponse.json(
      {
        error: `Некорректный User-Agent: ${e.message} Не копируйте example.com. Если в системе или Cursor уже задан HH_USER_AGENT, в .env.local используйте RABOTA_HH_USER_AGENT=ВашеИмя/1.0 (email@домен) — он имеет приоритет. Перезапустите npm run dev. См. DOCS/USAGE.md.`,
        log,
      },
      { status: 503 },
    );
  }

  if (e instanceof MissingHhUserAgentError) {
    const log = createAppLog({
      source,
      severity: "error",
      message: e.message,
      error: errorToLogFields(e),
      context,
    });
    console.error(serializeAppLog(log));
    return NextResponse.json(
      {
        error:
          "Не задан User-Agent для HH API. В .env.local добавьте RABOTA_HH_USER_AGENT=MyApp/1.0 (ваш@email.com) (предпочтительно) или HH_USER_AGENT. Если Cursor подставил HH_USER_AGENT с example.com — используйте только RABOTA_HH_USER_AGENT. См. DOCS/USAGE.md.",
        log,
      },
      { status: 503 },
    );
  }

  if (e instanceof HhApiError) {
    const log = createAppLog({
      source,
      severity: "error",
      message: e.message,
      context,
      error: errorToLogFields(e),
      response: {
        status: e.status,
        bodyPreview: truncateBody(e.bodyPreview),
      },
    });
    console.error(serializeAppLog(log));
    const hint =
      e.status === 400 && e.message.toLowerCase().includes("user-agent")
        ? " api.hh.ru отклонил User-Agent. Укажите в .env.local уникальное имя (не из туториалов) и свой настоящий email, не example.com; перезапустите dev-сервер. Если уже так — напишите на api@hh.ru с request_id из ответа."
        : "";
    return NextResponse.json(
      { error: `${e.message}.${hint}`, log },
      { status: 502 },
    );
  }

  const log = createAppLog({
    source,
    severity: "error",
    message: "Unexpected error",
    context,
    error: errorToLogFields(e),
  });
  console.error(serializeAppLog(log));
  return NextResponse.json({ error: String(e), log }, { status: 502 });
}
