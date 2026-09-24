# 4. Deploy

Goal: one public URL that serves the dashboard and the API, with the sample data loaded, and nothing secret in git.

## Scope

- `Dockerfile`: multi-stage build.
  One stage installs and builds both folders, another installs the backend's production dependencies only, and the final stage copies the compiled API, the built web app and those dependencies onto `node:24-slim`, running as the non-root `node` user.
- `.dockerignore`: dependencies, build output, env files, git, agent and docs folders, and `data/` stay out of the build context.
- Render web service built from the `Dockerfile`.

## Decisions

- **Render, not Vercel.**
  Vercel runs the API as serverless functions, which would lose the in-memory dataset between requests and split the app across two runtimes.
  A single long-running container keeps the dataset and serves everything from one origin.
- **Sample data as secret files.**
  The CSVs are not in git, so Render mounts them as secret files at `/etc/secrets` and `DATA_DIR` points there.
  Rotating the data is a dashboard change, not a commit.
- **pnpm pinned inside the image.**
  The root `package.json` is copied before `corepack` runs, so its `packageManager` field pins pnpm 11.
  Without it corepack fetched the latest major and the install failed with `ERR_PNPM_BAD_PM_VERSION`.
- **Free plan.**
  The service sleeps when idle and the first request after that takes about a minute; a restart reloads the sample, which matches assumption 3.

## Render settings

| Setting | Value |
| --- | --- |
| Runtime | Docker, from the repository root |
| Environment | `DATA_DIR=/etc/secrets` |
| Secret files | `trades.csv`, `prices.csv` |
| Health check path | `/api/health` |
| Auto-deploy | On push to `main` |

## Acceptance

- [x] `docker build` succeeds from a clean context.
- [x] The container, run as Render runs it (`PORT=10000`, data mounted read-only at `/etc/secrets`): health ok, `/` and its script return 200, 200 trades, no warnings, total P&L `-4401.3084972465`.
- [x] Runs as `node`; `Content-Security-Policy` and `X-Content-Type-Options: nosniff` are sent.
- [x] An invalid import answers 422 and leaves the portfolio unchanged.
- [x] The page renders in a browser with no console errors.
- [ ] The live service passes the same checks (`deploy-check` skill).
