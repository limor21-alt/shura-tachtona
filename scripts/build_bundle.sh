#!/usr/bin/env bash
# Rebuild the in-browser pipeline bundle from the TypeScript source.
# Run this after any change under supabase/functions/super-service/.
# The output (assets/pipeline.bundle.js) is committed to the repo so
# Netlify serves it directly as a static asset — no build step on the
# deploy side.

set -euo pipefail
cd "$(dirname "$0")/.."

npx -y esbuild \
  supabase/functions/super-service/pipeline.ts \
  --bundle \
  --format=esm \
  --target=es2022 \
  --outfile=assets/pipeline.bundle.js \
  --log-level=warning

echo "Bundled: $(ls -lh assets/pipeline.bundle.js | awk '{print $5}')"
