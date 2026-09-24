#!/usr/bin/env bash
# PostToolUse hook: after the agent edits a source file, let biome format it and sort its imports,
# so `pnpm verify` never fails on layout alone. Best effort: it never blocks the edit.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
file=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))' 2>/dev/null) || exit 0
file=${file#"$PWD/"}

case "$file" in
  backend/*|frontend/*) folder=${file%%/*} ;;
  *) exit 0 ;;
esac
case "$file" in
  *.ts|*.tsx|*.css|*.json) ;;
  *) exit 0 ;;
esac
command -v pnpm >/dev/null || exit 0

pnpm -C "$folder" exec biome check --write --no-errors-on-unmatched "${file#"$folder/"}" >/dev/null 2>&1
exit 0
