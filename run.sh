#!/usr/bin/env bash
# Serve the Kopi mockup (no caching) and open it in the browser.
# Usage: ./run.sh [port]   (default 8770)
set -e
PORT="${1:-8770}"
cd "$(dirname "$0")"

# free the port if an old server is still holding it
pkill -f "http.server $PORT" 2>/dev/null || true
pkill -f "serve.py $PORT" 2>/dev/null || true

URL="http://localhost:$PORT/presenter.html"
echo "Kopi mockup: $URL  (Ctrl+C to stop)"
(sleep 1; xdg-open "$URL" >/dev/null 2>&1 || true) &
exec python3 tools/serve.py "$PORT"
