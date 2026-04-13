<p align="center">
  <img src="./DOCS/images/readme-banner.png" alt="rabotaby-parser — аналитика вакансий по заработной плате" width="100%" />
</p>

<h1 align="center">rabotaby-parser</h1>

<p align="center">
  <strong>Аналитика зарплат по вакансиям (Беларусь)</strong> — вилки, среднее и медиана по данным HeadHunter API, фильтры и ссылки на <a href="https://rabota.by">rabota.by</a>.
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/ioffida/rabotaby-parser/actions"><img src="https://img.shields.io/github/actions/workflow/status/ioffida/rabotaby-parser/ci.yml?branch=main&label=CI" alt="CI" /></a>
</p>

<p align="center">
  <a href="https://github.com/ioffida/rabotaby-parser">Репозиторий</a>
  ·
  <a href="./DOCS/USAGE.md">Документация</a>
  ·
  <a href="./DOCS/DEPLOY.md">Деплой</a>
</p>

---

## Overview

Web app: **salary analytics for vacancies** (Belarus regions) using the [HeadHunter public API](https://github.com/hhru/api) — **no HTML scraping**. Vacancy links in the UI point to **rabota.by**.

## Features

- Multi-region search (flattened Belarus tree from HH `areas`)
- Position autocomplete (HH suggests)
- Salary stats: min / max / mean / median **per currency**; optional filters (exact title match, HH “with salary”, post-fetch salary fork + range)
- Vacancy list (up to 300 cards) with rabota.by URLs
- Structured **debug logs** in the UI on errors

## Stack

**Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**

## Quick start

```bash
npm install
cp .env.example .env.local
```

Set **`RABOTA_HH_USER_AGENT`** in `.env.local` to a value allowed by HeadHunter (see [.env.example](./.env.example)). Run the app with `npm run dev` or deploy and open your hosting URL.

Full setup, API query parameters, and production notes: **[DOCS/USAGE.md](./DOCS/USAGE.md)**.

## Documentation

| Doc | Description |
|-----|-------------|
| [DOCS/README.md](./DOCS/README.md) | Index of all docs |
| [DOCS/USAGE.md](./DOCS/USAGE.md) | Env vars, HTTP API, commands |
| [DOCS/ARCHITECTURE.md](./DOCS/ARCHITECTURE.md) | Modules and data flow |
| [DOCS/DEPLOY.md](./DOCS/DEPLOY.md) | GitHub, Vercel, CI |
| [DOCS/ERROR_LOGS.md](./DOCS/ERROR_LOGS.md) | Debug log JSON schema |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

## GitHub repository description (copy-paste)

Use in **Repository → ⚙ Settings → General → Description** (not committed to git):

**RU:** Аналитика зарплат по вакансиям (Беларусь): статистика по данным HeadHunter API, фильтры, ссылки на rabota.by. Next.js.

**EN:** Belarus vacancy salary analytics from the HeadHunter API: stats, filters, rabota.by links. Next.js.

## License

As set in the GitHub repository settings.
