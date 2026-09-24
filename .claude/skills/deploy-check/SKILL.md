---
name: deploy-check
description: Build the production image and smoke-test it the way Render runs it, or check the live service after a push. Use before and after a deployment.
---

**Locally, before pushing**
1. `docker build -t coinance .` must succeed.
2. Run it as Render does: `docker run --rm -p 10000:10000 -e PORT=10000 -e DATA_DIR=/etc/secrets -v "$PWD/data:/etc/secrets:ro" coinance`
3. Check: `/` and its `/assets/*.js` return 200; `/api/health` is `{"status":"ok"}`; `/api/portfolio` has 200 trades, no warnings, total P&L `-4401.3084972465` to 10 places; the process user is `node`; `Content-Security-Policy` and `X-Content-Type-Options: nosniff` are present; the page renders in a browser with no console errors.

**Live, after pushing** (Render redeploys `main`; the first request after idle can take ~60 s)
- Wait for the new build: the served asset names change when the frontend changed; for a backend-only change, `dataset.loadedAt` in `/api/portfolio` changes when the server restarts.
  Then repeat the checks above against the public URL.
- An invalid import must answer 422 and leave `/api/portfolio` unchanged; do not import valid files on the shared deployment.
