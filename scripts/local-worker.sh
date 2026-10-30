#!/bin/sh
# যেসব দোকান GitHub এর সার্ভার আটকায়, সেগুলোর জন্য মালিকের Mac থেকে worker।
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

# বিশেষ দোকানগুলোর স্ক্র্যাপ চালাতে চাইলে: ./scripts/local-worker.sh special
if [ "${1:-}" = "special" ]; then
  shift
  exec ./node_modules/.bin/tsx scripts/special-stores.ts "$@"
fi

exec ./node_modules/.bin/tsx workers/cli.ts "$@"
