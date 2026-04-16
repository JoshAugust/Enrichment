#!/bin/bash
# Usage: echo '{"domain":"x.com",...}' | bash dedup_append.sh
# Checks domain against existing_domains.txt and already-written output, appends if new

EXISTING="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt"
OUTPUT="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave2/jobboard_domains.jsonl"

while IFS= read -r line; do
  domain=$(echo "$line" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['domain'])" 2>/dev/null)
  if [ -z "$domain" ]; then continue; fi
  # Check existing
  if grep -qFx "$domain" "$EXISTING" 2>/dev/null; then continue; fi
  # Check already written
  if grep -qF "\"$domain\"" "$OUTPUT" 2>/dev/null; then continue; fi
  echo "$line" >> "$OUTPUT"
  echo "ADDED: $domain"
done
