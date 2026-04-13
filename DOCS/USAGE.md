# Usage

## Prerequisites

1. **Node.js 20+** recommended.
2. Copy [`.env.example`](../.env.example) to **`.env.local`** and set **`RABOTA_HH_USER_AGENT`** (recommended).

   Some terminals or Cursor inject a global **`HH_USER_AGENT`** (often with `example.com`); Next.js will **not** override an environment variable that already exists in the parent process, so a line for `HH_USER_AGENT` in `.env.local` may be ignored. **`RABOTA_HH_USER_AGENT` is read first** in app code and avoids that clash.

   HeadHunter **rejects** tutorial-style values: do **not** use `example.com`, `your-email`, `local-dev`, etc. Use a **unique** application name and **your** contact email in parentheses, for example:

   `YourAppName/1.0 (you@example-domain.com)`

   **Restart** `npm run dev` after every change to `.env.local`. See the [HeadHunter API repository](https://github.com/hhru/api).

## Commands

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

Set **`RABOTA_HH_USER_AGENT`** (or `HH_USER_AGENT` if there is no conflicting process env) in any production or preview host (e.g. Vercel **Environment Variables**).

---

## HTTP API (same origin as the app)

All routes are **Next.js Route Handlers** under `/api/*`. The browser calls your domain only; the server calls `https://api.hh.ru` with the configured User-Agent.

### `GET /api/areas`

Returns a flattened list of **Belarus** regions (and the country node) for the region checkboxes in the UI. Backed by HH `GET /areas`; very large JSON — in local dev you may see a Next.js warning about fetch cache size; responses still succeed.

### `GET /api/suggests?text=...`

Forwards to HH vacancy position suggestions (`suggests/vacancy_positions`). Used by the position autocomplete (minimum meaningful length is handled in the UI).

### `GET /api/vacancies/stats`

Paginates HH **`GET /vacancies`** (up to **20** pages × **100** = **2000** items max per HH rules), then aggregates salaries and builds a capped vacancy list for the right-hand column.

#### Query parameters

| Parameter | Meaning |
|-----------|---------|
| `text` | **Required.** Job search string. |
| `area` | **Required** — repeat for multiple IDs (`area=id1&area=id2`). |
| `exact_match` | `1` or `true` — search **only in vacancy name**: HH receives quoted `text` and `search_field=name` so unrelated “specialist” titles are reduced. |
| `only_with_salary` | `1` or `true` — HH `only_with_salary=true` (narrow upstream list). |
| `salary_range_only` | `1` or `true` — **after** fetch, keep vacancies whose salary fork **`from`–`to` lies fully inside** `[salary_filter_from, salary_filter_to]` (inclusive), in `salary_filter_currency`. Requires both filter bounds. Does **not** by itself set HH `only_with_salary`. |
| `salary_filter_from`, `salary_filter_to` | Non-negative integers, `from` ≤ `to`. Required when `salary_range_only` is on. Vacancy is kept only if `salary.from` ≥ this `from` and `salary.to` ≤ this `to`. |
| `salary_filter_currency` | One of: `BYN`, `RUR`, `USD`, `EUR`, `KZT`, `PLN`. Default `BYN`. Invalid code → **400** when `salary_range_only` is on. For the fork filter, **`BYN` matches vacancy salaries coded as `BYR`** (legacy HH code for the same Belarus ruble). |
| `experience`, `schedule`, `employment` | Optional HH dictionary IDs (aligned with [dictionaries](../src/lib/hh/dictionaries.ts) in the app). |

#### JSON response (success)

| Field | Meaning |
|-------|---------|
| `stats` | `found`, `fetched`, `withSalary`, `withoutSalary`, `byCurrency[]` (min/max/mean/median per currency). |
| `query` | Echo of normalized query: `text`, `area[]`, `exact_match`, `only_with_salary`, `salary_range_only`, salary filter fields, `experience`, `schedule`, `employment`. |
| `items` | Up to **300** list rows: `id`, `name`, `url` (always **rabota.by** vacancy link with tracking query), `employerName`, `salaryLabel`. |
| `listMeta` | `{ shown, uniqueLoaded }` — UI list cap vs unique snippets loaded. |

---

## Web UI (brief)

- **Regions:** multi-select checkboxes; selected regions appear as **chips** above the list.
- **Filters:** optional exact title match, HH “only with salary”, and post-fetch **salary fork + range** filter with amount fields and currency.
- **Tooltips:** “?” next to filter labels explain behavior on hover / keyboard focus.
- **Debug:** **Copy debug log** copies structured JSON when errors occur — see [ERROR_LOGS.md](./ERROR_LOGS.md).

---

## When something fails

Use **Copy debug log** in the UI or copy JSON from the terminal for failing API routes. Schema: [ERROR_LOGS.md](./ERROR_LOGS.md).
