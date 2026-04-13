# Vacancy analytics app — architecture

## Purpose

Web UI to search vacancies (rabota.by / HeadHunter ecosystem), pick a region, and compute salary statistics from public JSON API — no HTML scraping.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling (forced light theme)
- Server **Route Handlers** proxy `https://api.hh.ru` to avoid browser CORS

## Data flow

```mermaid
flowchart LR
  Browser[Browser_UI]
  NextAPI[Next_Route_Handlers]
  HHAPI[api.hh.ru]
  Browser -->|fetch same origin| NextAPI
  NextAPI -->|HTTPS + User-Agent| HHAPI
```

1. UI loads regions from `GET /api/areas` (cached tree slice for Belarus).
2. Position autocomplete: `GET /api/suggests?text=...` → HH `suggests/vacancy_positions`.
3. Analysis: `GET /api/vacancies/stats?text=...&area=...` → paginated `vacancies` search; server aggregates salaries. Optional `salary_range_only` + `salary_filter_*` applies a post-fetch fork overlap filter (see [USAGE.md](./USAGE.md)).

## Key modules

| Path | Role |
|------|------|
| `src/lib/hh/client.ts` | HTTP client to HH API (headers, errors) |
| `src/lib/hh/types.ts` | Response shapes for areas, vacancies, suggests |
| `src/lib/hh/areas.ts` | Find Belarus in tree, flatten sub-areas for `<select>` |
| `src/lib/vacancyStats.ts` | Midpoints, min/max/mean/median per currency |
| `src/lib/logger.ts` | Structured `AppLogPayload` for support / AI debugging |
| `src/components/AppErrorBoundary.tsx` | Catches React errors, exposes copyable log |

## Environment

- `RABOTA_HH_USER_AGENT` (preferred) or `HH_USER_AGENT` — **required** by HH API for identification (see [HH API docs](https://github.com/hhru/api)). Prefer `RABOTA_*` when an IDE exports a conflicting `HH_USER_AGENT`.

## Limitations

- HH search returns at most **2000** vacancies per query; stats are computed on fetched pages only.
- Salaries in different currencies are reported **per currency** (no FX conversion in v1).
