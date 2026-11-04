#!/bin/sh
# অ্যাডমিন থেকে চালানো যায় এমন "লোকাল" দাম-আনা জব; কাজটা এই মেশিনের IP থেকে চলে (GitHub যেসব দোকানে 403 পায়)।
# ম্যাক, Linux আর Termux (Android) এ একই: sh scripts/local-runner.sh [--every ৪] [--once]
# key থাকে ~/.config/dordam/worker.env এ (SUPABASE_URL, SUPABASE_SERVICE_KEY) অথবা .env.local এ।
set -eu
cd "$(dirname "$0")/.."

if [ -f "$HOME/.config/dordam/worker.env" ]; then
  set -a
  . "$HOME/.config/dordam/worker.env"
  set +a
elif [ -f ".env.local" ]; then
  set -a
  . ./.env.local
  set +a
fi

exec ./node_modules/.bin/tsx workers/local-runner.ts "$@"
