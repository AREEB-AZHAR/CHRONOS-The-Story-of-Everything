#!/bin/bash
# Runs image searches for each query line "name|query", writing /tmp/is/<name>.json
OUT=/tmp/is
mkdir -p "$OUT"
search_one() {
  local line="$1"
  local name="${line%%|*}"
  local query="${line#*|}"
  if [ -s "$OUT/$name.json" ]; then echo "skip $name"; return 0; fi
  echo "searching $name ..."
  z-ai image-search -q "$query" --count 6 --no-rank --gl us -o "$OUT/$name.json" > /dev/null 2>&1
  if [ -s "$OUT/$name.json" ]; then echo "done $name"; else echo "EMPTY $name"; fi
}
export -f search_one
export OUT

grep -v '^\s*$' /home/z/my-project/scripts/search-queries.txt | xargs -d '\n' -P 1 -I{} bash -c 'search_one "$@"' _ {}
echo "SEARCH ALL DONE"
