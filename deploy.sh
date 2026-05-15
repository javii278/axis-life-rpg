#!/bin/bash
set -e

REPO_DIR="/var/www/axis-life-rpg"
FRONTEND_DIR="$REPO_DIR/frontend"
BACKEND_DIR="$REPO_DIR/backend"

echo "==> [1/6] Actualizando código..."
cd "$REPO_DIR"
git checkout frontend/next-env.d.ts 2>/dev/null || true
git pull

echo "==> [2/6] Instalando dependencias frontend..."
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps

echo "==> [3/6] Construyendo frontend..."
npm run build

echo "==> [4/6] Reiniciando frontend (PM2)..."
pm2 restart axis-frontend

echo "==> [5/6] Instalando dependencias backend..."
cd "$BACKEND_DIR"
pip install -r requirements.txt -q

echo "==> [6/6] Reiniciando backend (systemd)..."
systemctl restart axis-backend.service

echo ""
echo "✓ Deploy completado."
pm2 show axis-frontend | grep -E "status|restart"
systemctl is-active axis-backend.service && echo "axis-backend.service: active"
