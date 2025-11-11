#!/usr/bin/env bash
set -euo pipefail

SITE="sniffly.musicsian.com"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP=$(date +%Y-%m-%d-%H%M%S)
WEB_ROOT="/var/www/$SITE"
RELEASES="$WEB_ROOT/releases"
CURRENT="$WEB_ROOT/current"
STAGE="$HOME/builds/$SITE/$STAMP"

echo "▶ Build Astro site"
cd "$PROJECT_DIR/site"
npm run build

echo "▶ Ensure web root exists"
sudo install -d -m 0755 "$WEB_ROOT"
sudo install -d -m 0755 "$RELEASES"

echo "▶ Stage built site → $STAGE"
mkdir -p "$STAGE"
rsync -az --delete "$PROJECT_DIR/site/dist"/ "$STAGE"/

echo "▶ Verify staged content"
test -f "$STAGE/index.html" || { echo "✗ index.html missing in stage"; exit 1; }
test -d "$STAGE/releases"   || { echo "✗ releases/ missing in stage"; exit 1; }

echo "▶ Publish release → $RELEASES/$STAMP"
sudo rsync -az --delete "$STAGE"/ "$RELEASES/$STAMP"/

echo "▶ Fix ownership/permissions"
sudo chown -R nginx:nginx "$RELEASES/$STAMP"
sudo find "$RELEASES/$STAMP" -type d -exec chmod 0755 {} +
sudo find "$RELEASES/$STAMP" -type f -exec chmod 0644 {} +

echo "▶ Flip symlink"
prev="$(readlink -f "$CURRENT" 2>/dev/null || true)"
[[ -n "$prev" ]] && echo "  Previous: $prev"
sudo ln -nfs "$RELEASES/$STAMP" "$CURRENT"

echo "▶ Restore SELinux context"
sudo restorecon -Rv "$RELEASES/$STAMP" >/dev/null 2>&1 || true

echo "▶ Test & reload Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✓ Deployed $STAMP → $SITE"
echo "  Live at: https://$SITE/"
