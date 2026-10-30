#!/usr/bin/env bash
# Starts a surfpool mainnet fork and a local blockchain-api, then seeds a
# fresh fixture wallet for the Maestro chain flows.
#
#   scripts/maestro-surfpool.sh env | sed 's/^export //' > .env.development.local  # point Metro at the fork
#   eval "$(scripts/maestro-surfpool.sh)"      # start, seed, export the env
#   scripts/maestro-surfpool.sh stop           # stop surfpool and the API
#
# Logs go to stderr and .maestro/surfpool/surfpool.log. Stdout carries only
# the `export` lines. See .maestro/README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/.maestro/surfpool"
COMPOSE=(docker compose -f "$DIR/docker-compose.yml")
RPC_URL="http://127.0.0.1:8899"
API_URL="http://127.0.0.1:3000"

if [ "${1:-}" = "env" ]; then
  # A dev bundle reads the .env files over the shell. So write these lines
  # without `export` to .env.development.local (see .maestro/README.md).
  printf 'export EXPO_PUBLIC_MAINNET_RPC_URL=%s\nexport EXPO_PUBLIC_MAINNET_HELIUM_TRANSACTION_API=%s\n' \
    "$RPC_URL" "$API_URL"
  exit 0
fi

if [ "${1:-}" = "stop" ]; then
  if [ -f "$DIR/surfpool.pid" ]; then
    # Surfpool ignores SIGTERM and shuts down on SIGINT.
    kill -INT "$(cat "$DIR/surfpool.pid")" 2>/dev/null || true
    rm -f "$DIR/surfpool.pid"
  fi
  "${COMPOSE[@]}" down -v >&2
  exit 0
fi

rpc_healthy() {
  curl -sf -X POST -H 'content-type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' "$RPC_URL" |
    grep -q '"ok"'
}

if rpc_healthy; then
  echo "[maestro-surfpool] reusing the surfpool on $RPC_URL" >&2
else
  echo "[maestro-surfpool] starting surfpool (mainnet fork)" >&2
  # Surfpool writes its .surfpool state dir into the working directory.
  cd "$DIR"
  # 0.0.0.0 so the blockchain-api container reaches it via host.docker.internal.
  surfpool start --network mainnet --no-tui --yes --host 0.0.0.0 \
    >"$DIR/surfpool.log" 2>&1 &
  echo $! >"$DIR/surfpool.pid"
  for _ in $(seq 1 60); do
    rpc_healthy && break
    sleep 1
  done
  rpc_healthy || {
    echo "[maestro-surfpool] surfpool did not start, see $DIR/surfpool.log" >&2
    exit 1
  }
fi

echo "[maestro-surfpool] starting blockchain-api" >&2
"${COMPOSE[@]}" up -d --wait >&2

# An Android emulator reaches the host ports only through adb reverse.
if command -v adb >/dev/null && adb get-state >/dev/null 2>&1; then
  adb reverse tcp:8899 tcp:8899 >&2
  adb reverse tcp:3000 tcp:3000 >&2
fi

echo "[maestro-surfpool] seeding the fixture wallet" >&2
node "$ROOT/scripts/maestro-seed.ts"
