#!/bin/bash
# Launch Chrome with remote debugging enabled for review scraping.
#
# After Chrome opens:
#   1. Sign into your Google account (if not already signed in)
#   2. Run: npx tsx scripts/scrape-reviews-cdp.ts
#
# Uses a separate profile dir so it won't affect your normal Chrome.

PROFILE_DIR="$HOME/chrome-debug-profile"
PORT=9222

echo "Launching Chrome with remote debugging on port $PORT..."
echo "Profile directory: $PROFILE_DIR"
echo ""
echo "After Chrome opens:"
echo "  1. Sign into Google (if needed)"
echo "  2. In another terminal, run:"
echo "     cd $(pwd)"
echo "     npx tsx scripts/scrape-reviews-cdp.ts"
echo ""

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  2>/dev/null &

echo "Chrome launched (PID: $!)"
echo "Waiting for debugger to be ready..."
sleep 2

# Check if debugging port is accessible
if curl -s http://127.0.0.1:$PORT/json/version > /dev/null 2>&1; then
  echo "Chrome debugger ready at http://127.0.0.1:$PORT"
else
  echo "Warning: Debugger not yet ready. Wait a moment and try the scraper."
fi
