#!/bin/sh
set -e

# Generate runtime env.js from container env vars.
# Edit VITE_API_BASE_URL (and others) in Easypanel → Ambiente, redeploy, and the
# bundle will pick it up from window.__ENV__ without rebuilding the image.
#
# This script is picked up automatically by nginx:alpine's entrypoint, which
# executes every *.sh in /docker-entrypoint.d/ before starting nginx.
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}"
};
EOF
