#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PAGES_PROJECT:-community-based-helper}"
BRANCH="$(git branch --show-current)"

step() { printf '\n\033[1m› %s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

[[ -z "$(git status --porcelain)" ]] || fail "কমিট না করা পরিবর্তন আছে — আগে commit করুন।"
grep -q '^NEXT_PUBLIC_SUPABASE_URL=.' .env.local 2>/dev/null || fail ".env.local-এ NEXT_PUBLIC_SUPABASE_URL নেই — docs/DEPLOY.md দেখুন।"
grep -q '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.' .env.local || fail ".env.local-এ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY নেই — docs/DEPLOY.md দেখুন।"

step "চেক — টাইপ ও লিন্ট"
npm run typecheck
npm run lint

step "Supabase — নতুন migration"
npx supabase db push

step "বিল্ড"
npm run build

step "Cloudflare Pages — আপলোড (ব্রাঞ্চ: $BRANCH)"
npx wrangler pages deploy out \
  --project-name "$PROJECT" \
  --branch "$BRANCH" \
  --commit-hash "$(git rev-parse HEAD)" \
  --commit-message "$(git log -1 --pretty=%s)"
