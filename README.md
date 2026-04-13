# rabotaby-parser

Web app: **salary analytics for vacancies** (Belarus regions) using the [HeadHunter public API](https://github.com/hhru/api) — no HTML scraping.

Stack: **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**.

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set RABOTA_HH_USER_AGENT (see .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

- [DOCS/USAGE.md](./DOCS/USAGE.md) — env vars, API query parameters
- [DOCS/ARCHITECTURE.md](./DOCS/ARCHITECTURE.md) — data flow and modules
- [DOCS/DEPLOY.md](./DOCS/DEPLOY.md) — GitHub + production hosting

## Scripts

| Command        | Description           |
|----------------|-----------------------|
| `npm run dev`  | Development server    |
| `npm run build`| Production build      |
| `npm start`    | Run production server |
| `npm run lint` | ESLint                |

## License

Private / as set in repository settings.
