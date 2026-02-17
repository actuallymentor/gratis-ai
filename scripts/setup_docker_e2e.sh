#!/usr/bin/env bash
# Setup script for E2E testing in a Docker container (Claudius).
# Installs system dependencies for Playwright, Electron, and node-llama-cpp.
#
# Usage: bash scripts/setup_docker_e2e.sh

set -euo pipefail

echo "==> Setting up Docker E2E environment"

# ── System dependencies ──────────────────────────────────────────────────────

echo "==> Installing system packages (X11, Chromium, build tools)..."
sudo apt-get update -qq

sudo apt-get install -y --no-install-recommends \
    xvfb \
    xauth \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxrandr2 \
    libxss1 \
    libgtk-3-0 \
    chromium \
    cmake \
    build-essential \
    2>/dev/null || echo "Some packages may not be available — continuing"

# ── Xvfb for headless display ────────────────────────────────────────────────

echo "==> Starting Xvfb on :99..."
if ! pgrep -x Xvfb > /dev/null; then
    Xvfb :99 -screen 0 1280x720x24 -nolisten tcp &
    export DISPLAY=:99
    echo "export DISPLAY=:99" >> ~/.bashrc
    echo "Xvfb started on :99"
else
    echo "Xvfb already running"
fi

# ── Playwright browsers ─────────────────────────────────────────────────────

echo "==> Installing Playwright browsers..."
npx playwright install chromium 2>/dev/null || echo "Playwright browser install skipped"

# Symlink system chromium for Playwright if needed
if command -v chromium > /dev/null 2>&1; then
    CHROMIUM_PATH=$(command -v chromium)
    echo "System Chromium at: $CHROMIUM_PATH"
fi

# ── Platform-specific npm dependencies ───────────────────────────────────────

echo "==> Ensuring platform-specific rollup binary..."
npm install @rollup/rollup-linux-arm64-gnu 2>/dev/null || \
npm install @rollup/rollup-linux-x64-gnu 2>/dev/null || \
echo "Rollup platform binary already available"

# ── Electron binary ─────────────────────────────────────────────────────────

echo "==> Ensuring Electron binary is installed..."
npx electron --version 2>/dev/null || echo "Electron binary check done"

# ── node-llama-cpp build ─────────────────────────────────────────────────────

echo "==> Building node-llama-cpp (GGML_NATIVE=OFF for Docker compatibility)..."
if [ -d "node_modules/node-llama-cpp" ]; then
    GGML_NATIVE=OFF npx node-llama-cpp download 2>/dev/null || \
    echo "node-llama-cpp build skipped (may not be needed for browser-only tests)"
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "==> Docker E2E setup complete!"
echo "    DISPLAY=$DISPLAY"
echo ""
echo "Run tests with:"
echo "  npx playwright test --config=tests/playwright.config.js --project=ui"
echo "  npx playwright test --config=tests/playwright.config.js --project=inference"
echo "  DISPLAY=:99 npx playwright test --config=tests/electron.config.js --project=smoke"
echo ""
