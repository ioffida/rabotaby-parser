# Publishing (GitHub + hosting)

Source repository: **[ioffida/rabotaby-parser](https://github.com/ioffida/rabotaby-parser)** — default branch **`main`**.

---

## 1. Push code to GitHub

If the repo already exists and you have a local clone:

```bash
git add -A
git commit -m "Your message"
git push origin main
```

First-time setup (empty remote):

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ioffida/rabotaby-parser.git
git push -u origin main
```

Authentication: [GitHub CLI](https://cli.github.com/) (`gh auth login`), HTTPS + [personal access token](https://docs.github.com/en/authentication), or SSH (`git@github.com:ioffida/rabotaby-parser.git`).

---

## 2. Environment variables (all hosts)

Set **`RABOTA_HH_USER_AGENT`** to a **single string** allowed by HeadHunter (unique app name + real contact in parentheses). See [USAGE.md](./USAGE.md) and [`.env.example`](../.env.example).

Never commit **`.env.local`** or real production secrets into git.

---

## 3. Vercel (recommended for this Next.js app)

1. Sign in at [vercel.com](https://vercel.com) and choose **Add New… → Project**.
2. **Import** `ioffida/rabotaby-parser`, branch **`main`**.
3. **Framework Preset:** Next.js (auto-detected). **Root Directory:** `./` unless the app lives in a subfolder.
4. Expand **Environment Variables** and add:
   - **Name:** `RABOTA_HH_USER_AGENT`
   - **Value:** your full UA string (e.g. `MyApp/1.0 (me@domain.com)`).
5. Click **Deploy**. After the first deploy, open the production URL from the dashboard.

To change env vars later: **Project → Settings → Environment Variables**, then **Deployments → … → Redeploy** so runtime picks up new values.

**Preview deployments** (pull requests) also need `RABOTA_HH_USER_AGENT` if you want HH API calls to work there — add the variable for **Preview** (and optionally **Development**) in Vercel.

---

## 4. Why not GitHub Pages alone

This project uses **Next.js Route Handlers** (`/api/*`) as a **server-side** proxy to `api.hh.ru`. **GitHub Pages** only serves **static** files; it cannot run Node server routes. Use Vercel, another Node host, or a separate backend — see [USAGE.md](./USAGE.md) for the API contract.

You can still set the GitHub repo **Website** URL in **Settings → General** to your **Vercel** (or other) production link.

---

## 5. GitHub Actions CI

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on **`push`** / **`pull_request`** to **`main`**: `npm ci` → `npm run lint` → `npm run build` with a **placeholder** `RABOTA_HH_USER_AGENT` so `next build` does not fail. Production secrets are **not** required for CI.

---

## 6. Repository metadata (GitHub)

In **Settings → General**: description, **Website** (production URL after deploy).
