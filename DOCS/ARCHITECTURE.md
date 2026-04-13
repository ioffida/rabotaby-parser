# Vacancy salary analytics — architecture

## Purpose

Single-page web app: search vacancies (Belarus / **rabota.by** ecosystem via HeadHunter JSON API), multi-region selection, salary statistics (min / max / mean / median per currency), and a linked vacancy list — **no HTML scraping**.

Repository: [ioffida/rabotaby-parser](https://github.com/ioffida/rabotaby-parser).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (light UI)
- **Route Handlers** under `/api/*` proxy `https://api.hh.ru` (avoids browser CORS; server sends required `User-Agent`)

## Data flow

```mermaid
flowchart LR
  Browser[Browser_UI]
  NextAPI[Next_Route_Handlers]
  HHAPI[api.hh.ru]
  Browser -->|fetch same origin| NextAPI
  NextAPI -->|HTTPS plus User_Agent| HHAPI
```

1. **`GET /api/areas`** — Belarus slice of HH areas tree (flattened for checkboxes).
2. **`GET /api/suggests?text=...`** — HH `suggests/vacancy_positions` for autocomplete.
3. **`GET /api/vacancies/stats`** — Loops HH `GET /vacancies` with `text`, `area[]`, optional `only_with_salary`, `experience`, `schedule`, `employment`. When **`exact_match`**, the server sends **quoted** `text` and **`search_field=name`**. After all pages: optional **salary fork fully inside user range** filter, then **`aggregateVacancySalaries`** + **`buildVacancyListForResponse`**.

## Key modules

| Path | Role |
|------|------|
| [`src/app/api/areas/route.ts`](../src/app/api/areas/route.ts) | Regions payload for UI |
| [`src/app/api/suggests/route.ts`](../src/app/api/suggests/route.ts) | Position suggestions |
| [`src/app/api/vacancies/stats/route.ts`](../src/app/api/vacancies/stats/route.ts) | Search, filters, stats + list JSON |
| [`src/lib/hh/client.ts`](../src/lib/hh/client.ts) | HH HTTP client (headers, query serialization) |
| [`src/lib/hh/userAgent.ts`](../src/lib/hh/userAgent.ts) | Resolves `RABOTA_HH_USER_AGENT` / `HH_USER_AGENT` for requests |
| [`src/lib/hh/types.ts`](../src/lib/hh/types.ts) | HH response shapes used by the app |
| [`src/lib/hh/areas.ts`](../src/lib/hh/areas.ts) | Belarus subtree + flatten for UI |
| [`src/lib/hh/dictionaries.ts`](../src/lib/hh/dictionaries.ts) | Allowed `experience` / `schedule` / `employment` IDs |
| [`src/lib/hh/salaryFilterCurrencies.ts`](../src/lib/hh/salaryFilterCurrencies.ts) | Allowed currency codes for fork filter |
| [`src/lib/hh/routeErrors.ts`](../src/lib/hh/routeErrors.ts) | Maps HH failures to JSON + `AppLogPayload` |
| [`src/lib/vacancyStats.ts`](../src/lib/vacancyStats.ts) | Salary midpoints, aggregates per currency |
| [`src/lib/vacancyListItem.ts`](../src/lib/vacancyListItem.ts) | List rows; **rabota.by** vacancy URLs (not `alternate_url` hh.ru) |
| [`src/lib/vacancySalaryForkFilter.ts`](../src/lib/vacancySalaryForkFilter.ts) | Post-fetch: forks fully inside user min–max; **BYN** filter also accepts HH **`BYR`** (Belarus ruble legacy code) |
| [`src/lib/format.ts`](../src/lib/format.ts) | Money / salary range labels |
| [`src/lib/logger.ts`](../src/lib/logger.ts) | `AppLogPayload` for support / debugging |
| [`src/components/SearchApp.tsx`](../src/components/SearchApp.tsx) | Main client UI: filters, chips, tooltips, results |
| [`src/components/AppErrorBoundary.tsx`](../src/components/AppErrorBoundary.tsx) | React errors → copyable log |
| [`src/app/providers.tsx`](../src/app/providers.tsx) | Wraps tree with error boundary |
| [`next.config.ts`](../next.config.ts) | `devIndicators: false`, `poweredByHeader: false` |

## Environment

- **`RABOTA_HH_USER_AGENT`** (preferred) or **`HH_USER_AGENT`** — required style string for HH (see [USAGE.md](./USAGE.md)). Use `RABOTA_*` when the IDE or shell already exports `HH_USER_AGENT`.

## Limitations

- HH returns at most **2000** vacancies per search; statistics and list are based on **fetched** pages only.
- **No FX conversion** — figures are **per currency** as returned by HH.
- **`/api/areas`** response can exceed Next’s default fetch cache size in dev; route still returns **200**.
