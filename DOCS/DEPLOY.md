# Publishing (GitHub + hosting)

## 1. Push source to GitHub

Repository: [ioffida/rabotaby-parser](https://github.com/ioffida/rabotaby-parser), default branch `main`.

```bash
git init
git add -A
git commit -m "Initial commit: vacancy salary analytics (Next.js)"
git branch -M main
git remote add origin https://github.com/ioffida/rabotaby-parser.git
git push -u origin main
```

If the remote already exists or the repo was created empty on GitHub, use `git remote set-url origin …` and then `git push -u origin main`.

Authentication: GitHub CLI (`gh auth login`), HTTPS with a personal access token, or SSH (`git@github.com:ioffida/rabotaby-parser.git`).

## 2. Environment variables (production)

Set **`RABOTA_HH_USER_AGENT`** in the host’s environment to a real value allowed by HeadHunter (see [USAGE.md](./USAGE.md) and [.env.example](../.env.example)).

## 3. Recommended hosting

This app uses **Next.js Route Handlers** (server API). **GitHub Pages** alone is not suitable for the full stack.

- **Vercel**: import the GitHub repo, set `RABOTA_HH_USER_AGENT`, deploy.
- **Other Node hosts**: run `npm run build` and `npm start`, same env var.

## 4. Repository metadata (GitHub website)

In **Settings → General**: add description and homepage URL after deployment.

In **Settings → Secrets and variables → Actions**: no secrets required for CI build (workflow uses a placeholder `RABOTA_HH_USER_AGENT` only for `next build`).
