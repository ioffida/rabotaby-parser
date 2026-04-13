# Usage

## Prerequisites

1. Node.js 20+ recommended.
2. Copy `.env.example` to `.env.local` and set **`RABOTA_HH_USER_AGENT`** (recommended). Some terminals or Cursor inject a global **`HH_USER_AGENT`** (often with `example.com`); Next.js will **not** override an env var that already exists in the process, so your `.env.local` line for `HH_USER_AGENT` may be ignored. **`RABOTA_HH_USER_AGENT` is read first** and avoids that clash.

   HeadHunter **rejects** tutorial-style values: do **not** use `example.com`, `your-email`, `local-dev`, etc. Use a **unique** app name and **your** email, e.g. `BelarusSalaryDemo/1.0 (ivan.petrov@gmail.com)`.

   **Restart** `npm run dev` after every change to `.env.local`. See the [HH API repository](https://github.com/hhru/api).

## Commands

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## `GET /api/vacancies/stats` query parameters

| Parameter | Meaning |
|-----------|---------|
| `text` | Required. Job search text. |
| `area` | Required (repeat for multiple). Region IDs. |
| `only_with_salary` | `1` or `true` — HH returns only vacancies that include salary info. |
| `salary_range_only` | `1` or `true` — after the full HH page fetch (up to 2000 items), keep vacancies whose `salary.from` / `salary.to` overlap your range in the chosen currency. Requires `salary_filter_from` and `salary_filter_to` (non-negative integers, `from` ≤ `to`). Does **not** imply HH `only_with_salary` by itself (use that checkbox separately to narrow the upstream list). |
| `salary_filter_from`, `salary_filter_to` | Required when `salary_range_only` is set. Inclusive bounds; a vacancy is kept if its fork intersects `[from, to]` (same currency). |
| `salary_filter_currency` | ISO-style HH currency code when using fork filter: `BYN`, `RUR`, `USD`, `EUR`, `KZT`, `PLN`. Defaults to `BYN`; invalid values return `400` when `salary_range_only` is on. |
| `experience`, `schedule`, `employment` | Optional HH dictionary IDs (see app dictionaries). |

## Production build

```bash
npm run build
npm start
```

Set `RABOTA_HH_USER_AGENT` (or `HH_USER_AGENT` if no parent-process override) in the deployment environment variables.

## When something fails

Use **Copy debug log** in the UI or copy the JSON printed in the terminal for API routes. Format is described in [ERROR_LOGS.md](./ERROR_LOGS.md).
