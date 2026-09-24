# One image: the NestJS API serves the built React app from the same origin.

FROM node:24-slim AS pnpm
RUN corepack enable
WORKDIR /app
# Its "packageManager" pins pnpm; without it corepack would fetch the latest release.
COPY package.json ./

FROM pnpm AS build
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml backend/
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/
RUN pnpm -C backend install --frozen-lockfile && pnpm -C frontend install --frozen-lockfile
COPY backend backend
COPY frontend frontend
RUN pnpm -C frontend build && pnpm -C backend build

FROM pnpm AS backend-prod-deps
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml backend/
RUN pnpm -C backend install --prod --frozen-lockfile

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    STATIC_DIR=/app/frontend/dist
WORKDIR /app/backend
COPY --from=backend-prod-deps /app/backend/node_modules node_modules
COPY --from=build /app/backend/dist dist
COPY --from=build /app/frontend/dist /app/frontend/dist
COPY backend/package.json package.json
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
