# Error logs — format for debugging

When something fails, use **“Copy debug log”** in the UI (or copy server / terminal output). Logs use a single **JSON** object so they are easy to paste into chat or tickets.

## `AppLogPayload` schema

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `1` | Format version |
| `timestamp` | ISO string | When the log was created |
| `source` | string | e.g. `client`, `react-error-boundary`, `api:areas`, `api:vacancies/stats` |
| `severity` | `info` \| `warning` \| `error` | Level |
| `message` | string | Human-readable summary |
| `context` | object | Optional: route, filters, truncated request info |
| `error` | object? | `name`, `message`, `stack` |
| `request` | object? | `method`, `url`, `query` |
| `response` | object? | `status`, `statusText`, `bodyPreview` (truncated) |

## Example (API failure — vacancies stats)

```json
{
  "schemaVersion": 1,
  "timestamp": "2026-04-13T12:00:00.000Z",
  "source": "api:vacancies/stats",
  "severity": "error",
  "message": "HeadHunter API returned an error",
  "context": {
    "text": "продавец",
    "area": ["1002"],
    "exact_match": false,
    "only_with_salary": true,
    "salary_range_only": false,
    "experience": "",
    "schedule": "",
    "employment": "",
    "requestQuery": { "text": "продавец", "area": "1002", "only_with_salary": "1" }
  },
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

If `response.bodyPreview` mentions **`bad_user_agent`** / **Bad User-Agent**, HH rejected the `User-Agent` string.

**Fix:** set **`RABOTA_HH_USER_AGENT`** in `.env.local` (local) or the host’s env (production) to a **real** contact form: `AppName/1.0 (you@real-domain.com)`. Prefer `RABOTA_*` if Cursor or the shell already exports **`HH_USER_AGENT`** — Next.js will not override an existing process env from `.env.local`.

## Developer notes

- Logs must **not** include secrets; do not log full `RABOTA_HH_USER_AGENT` / `HH_USER_AGENT` values if you treat them as sensitive.
- Truncate large bodies (e.g. first ~2 KB) in `bodyPreview`.
