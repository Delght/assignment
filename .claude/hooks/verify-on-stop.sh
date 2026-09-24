#!/usr/bin/env bash
# Stop hook: the agent cannot finish while code it changed fails `pnpm verify`.
# Runs only when backend/, frontend/ or scripts/ have uncommitted changes.
set -uo pipefail

input=$(cat)
# Already continuing because of this hook: let it stop rather than loop.
if grep -q '"stop_hook_active": *true' <<<"$input"; then exit 0; fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -z "$(git status --porcelain -- backend frontend scripts)" ] && exit 0
if ! command -v pnpm >/dev/null; then
  echo "verify-on-stop: pnpm is not on PATH, verify skipped" >&2
  exit 0
fi

if ! output=$(pnpm verify 2>&1); then
  { echo "pnpm verify failed. Fix it before finishing:"; tail -n 40 <<<"$output"; } >&2
  exit 2
fi
