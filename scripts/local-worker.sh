#!/bin/sh
# যেসব দোকান GitHub এর সার্ভার আটকায়, সেগুলোর জন্য মালিকের Mac থেকে একই worker (একই পরিচয়, robots.txt আর গতির একই নিয়ম)।
# key থাকে ~/.config/dordam/worker.env এ (SUPABASE_URL, SUPABASE_SERVICE_KEY), repo তে নয়।
set -eu
cd "$(dirname "$0")/.."
set -a
. "$HOME/.config/dordam/worker.env"
set +a
exec ./node_modules/.bin/tsx workers/cli.ts "$1"
