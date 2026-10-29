#!/bin/sh
# seed.sql এক অনুরোধে Supabase API-র সীমা ছাড়ায় (413 request entity too large), তাই লাইন না ভেঙে
# ~৫০০KB-এর টুকরায় ক্রম ধরে চালানো। প্রতিটা লাইন একটা নিরাপদ insert, তাই মাঝে থামলে আবার পুরোটা চালালেই হয়।
set -e
dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT
LC_ALL=C awk -v dir="$dir" -v max=500000 '
  BEGIN { n = 0; size = 0; file = sprintf("%s/%03d.sql", dir, n) }
  { if (size > 0 && size + length($0) > max) { n++; size = 0; file = sprintf("%s/%03d.sql", dir, n) } print > file; size += length($0) + 1 }
' supabase/seed.sql
total=$(ls "$dir" | wc -l | tr -d ' ')
i=0
for file in "$dir"/*.sql; do
  i=$((i + 1))
  echo "seed $i/$total"
  npx supabase db query --linked -f "$file" > /dev/null
done
echo "seed শেষ"
