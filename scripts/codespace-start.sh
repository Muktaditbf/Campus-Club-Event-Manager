#!/usr/bin/env bash
# Starts the web app in GitHub Codespaces once MySQL is accepting connections.
set -e
cd "$(dirname "$0")/.."
echo "Waiting for MySQL on ${DB_HOST:-127.0.0.1}:${DB_PORT:-3306} ..."
until (echo > "/dev/tcp/${DB_HOST:-127.0.0.1}/${DB_PORT:-3306}") 2>/dev/null; do sleep 2; done
echo "MySQL is up. Starting the app on port 3000 ..."
[ -d node_modules ] || npm install
exec npm run dev
