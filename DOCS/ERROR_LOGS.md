# Error logs — format for debugging

When something fails, use **“Copy debug log”** in the UI (or copy server logs). Logs use a single JSON object so they are easy to paste into chat or tickets.

## `AppLogPayload` schema

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `1` | Format version |
| `timestamp` | ISO string | When the log was created |
| `source` | string | e.g. `client`, `react-error-boundary`, `api:areas` |
| `severity` | `info` \| `warning` \| `error` | Level |
| `message` | string | Human-readable summary |
| `context` | object | Optional: route, user action, request id |
| `error` | object? | `name`, `message`, `stack` |
| `request` | object? | `method`, `url`, `query` |
| `response` | object? | `status`, `statusText`, `bodyPreview` (truncated) |

## Example (API failure)

```json
{
  "schemaVersion": 1,
  "timestamp": "2026-04-13T12:00:00.000Z",
  "source": "api:vacancies/stats",
  "severity": "error",
  "message": "HeadHunter API returned an error",
  "context": { "text": "продавец", "area": "1002" },
  "response": { "status": 403, "statusText": "Forbidden", "bodyPreview": "..." }
}
```

## Example (React error boundary)

```json
{
  "schemaVersion": 1,
  "timestamp": "2026-04-13T12:00:00.000Z",
  "source": "react-error-boundary",
  "severity": "error",
  "message": "Uncaught error in component tree",
  "error": {
    "name": "TypeError",
    "message": "Cannot read properties of undefined",
    "stack": "..."
  }
}
```

## HeadHunter `bad_user_agent`

If `response.bodyPreview` contains `bad_user_agent` / `Bad User-Agent header`, api.hh.ru blocked the `User-Agent` string. Fix: set **`RABOTA_HH_USER_AGENT`** in `.env.local` (preferred) with your **real email** in parentheses. Use `RABOTA_*` if the shell or Cursor already defines `HH_USER_AGENT` (Next.js will not override existing process env vars from `.env.local`).

## Developer notes

- Logs must **not** include secrets; never log `RABOTA_HH_USER_AGENT` / `HH_USER_AGENT` values in full if treated as sensitive.
- Truncate large bodies (e.g. first 2 KB) in `bodyPreview`.
