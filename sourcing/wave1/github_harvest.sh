#!/bin/bash
set -euo pipefail

WORKSPACE="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
DEDUP_FILE="$WORKSPACE/jordan.ai/sourcing/shared/existing_domains.txt"
OUT_FILE="$WORKSPACE/jordan.ai/sourcing/wave1/github_domains.jsonl"
PROGRESS="$WORKSPACE/jordan.ai/sourcing/logs/github_progress.md"
SEEN_ORGS="$WORKSPACE/jordan.ai/sourcing/wave1/.seen_orgs.txt"
SEEN_DOMAINS="$WORKSPACE/jordan.ai/sourcing/wave1/.seen_domains.txt"

# Init files
> "$OUT_FILE"
> "$SEEN_ORGS"
> "$SEEN_DOMAINS"

echo "# GitHub Domain Harvest Progress" > "$PROGRESS"
echo "Started: $(date)" >> "$PROGRESS"
echo "" >> "$PROGRESS"

TOTAL_NEW=0
TOTAL_SKIPPED=0
TOTAL_NO_SITE=0
API_CALLS=0

clean_domain() {
  echo "$1" | sed -E 's|^https?://||' | sed -E 's|^www\.||' | sed -E 's|/.*||' | sed -E 's|:.*||' | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]//g'
}

log_progress() {
  echo "## $1" >> "$PROGRESS"
  echo "- New domains so far: $TOTAL_NEW" >> "$PROGRESS"
  echo "- Skipped (existing): $TOTAL_SKIPPED" >> "$PROGRESS"
  echo "- No website: $TOTAL_NO_SITE" >> "$PROGRESS"
  echo "- API calls: $API_CALLS" >> "$PROGRESS"
  echo "- Time: $(date)" >> "$PROGRESS"
  echo "" >> "$PROGRESS"
}

api_call() {
  API_CALLS=$((API_CALLS + 1))
  # Rate limit: 7s between calls
  sleep 7
  curl -s -H "Accept: application/vnd.github.v3+json" "$1" 2>/dev/null
}

process_repos_page() {
  local json="$1"
  local lang="$2"
  
  # Extract owner logins that are Organizations
  local orgs
  orgs=$(echo "$json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    items = data.get('items', [])
    seen = set()
    for item in items:
        owner = item.get('owner', {})
        login = owner.get('login', '')
        otype = owner.get('type', '')
        stars = item.get('stargazers_count', 0)
        if otype == 'Organization' and login and login not in seen:
            seen.add(login)
            print(f'{login}\t{stars}')
except:
    pass
" 2>/dev/null)
  
  while IFS=$'\t' read -r org_login stars; do
    [ -z "$org_login" ] && continue
    
    # Skip if we already processed this org
    if grep -qxF "$org_login" "$SEEN_ORGS" 2>/dev/null; then
      continue
    fi
    echo "$org_login" >> "$SEEN_ORGS"
    
    # Fetch org profile
    local org_json
    org_json=$(api_call "https://api.github.com/orgs/$org_login")
    
    # Check for rate limit
    if echo "$org_json" | grep -q "API rate limit"; then
      echo "Rate limited, sleeping 60s..." >&2
      echo "- RATE LIMITED at $(date), sleeping 60s" >> "$PROGRESS"
      sleep 60
      org_json=$(api_call "https://api.github.com/orgs/$org_login")
    fi
    
    # Extract blog/website and name
    local result
    result=$(echo "$org_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    blog = (data.get('blog') or '').strip()
    name = (data.get('name') or data.get('login') or '').strip()
    company = (data.get('company') or '').strip()
    repos = data.get('public_repos', 0)
    # Try blog first, then company
    site = blog if blog else company
    print(f'{site}\t{name}\t{repos}')
except:
    print('\t\t0')
" 2>/dev/null)
    
    local site name repos
    site=$(echo "$result" | cut -f1)
    name=$(echo "$result" | cut -f2)
    repos=$(echo "$result" | cut -f3)
    
    if [ -z "$site" ] || [ "$site" = "" ]; then
      TOTAL_NO_SITE=$((TOTAL_NO_SITE + 1))
      continue
    fi
    
    # Clean domain
    local domain
    domain=$(clean_domain "$site")
    
    # Skip empty, no TLD, github.io, github.com domains
    if [ -z "$domain" ] || ! echo "$domain" | grep -q '\.' || echo "$domain" | grep -qE '\.github\.(io|com)$'; then
      TOTAL_NO_SITE=$((TOTAL_NO_SITE + 1))
      continue
    fi
    
    # Skip if already seen this run
    if grep -qxF "$domain" "$SEEN_DOMAINS" 2>/dev/null; then
      continue
    fi
    
    # Skip if in dedup file
    if grep -qxF "$domain" "$DEDUP_FILE" 2>/dev/null; then
      TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
      echo "$domain" >> "$SEEN_DOMAINS"
      continue
    fi
    
    # Categorize based on language
    local category="developer-tools"
    
    # Write to JSONL immediately
    echo "{\"domain\": \"$domain\", \"name\": \"$name\", \"source\": \"github\", \"category\": \"$category\", \"metadata\": {\"stars\": $stars, \"language\": \"$lang\", \"repos\": $repos, \"github_org\": \"$org_login\"}}" >> "$OUT_FILE"
    echo "$domain" >> "$SEEN_DOMAINS"
    TOTAL_NEW=$((TOTAL_NEW + 1))
    
    echo "  ✓ $domain ($name) - $stars★" >&2
    
  done <<< "$orgs"
}

# Search queries: different languages and star ranges to maximize coverage
LANGUAGES=("javascript" "typescript" "python" "go" "rust" "ruby" "java" "kotlin" "swift" "c%2B%2B" "c%23" "php" "scala" "elixir" "haskell")
STAR_RANGES=("50..200" "200..500" "500..1000" "1000..2000")

for lang in "${LANGUAGES[@]}"; do
  for star_range in "${STAR_RANGES[@]}"; do
    echo "=== Searching: $lang stars:$star_range ===" >&2
    log_progress "Searching $lang stars:$star_range"
    
    # Page 1
    url="https://api.github.com/search/repositories?q=stars:${star_range}+language:${lang}+pushed:%3E2025-01-01&sort=stars&per_page=100&page=1"
    json=$(api_call "$url")
    
    # Check for rate limit
    if echo "$json" | grep -q "API rate limit"; then
      echo "Rate limited, sleeping 65s..." >&2
      echo "- RATE LIMITED at $(date), sleeping 65s" >> "$PROGRESS"
      sleep 65
      json=$(api_call "$url")
    fi
    
    total=$(echo "$json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_count',0))" 2>/dev/null || echo "0")
    echo "  Found $total repos" >&2
    
    process_repos_page "$json" "$lang"
    
    # Page 2 if there are enough results
    if [ "$total" -gt 100 ]; then
      url2="https://api.github.com/search/repositories?q=stars:${star_range}+language:${lang}+pushed:%3E2025-01-01&sort=stars&per_page=100&page=2"
      json2=$(api_call "$url2")
      if echo "$json2" | grep -q "API rate limit"; then
        sleep 65
        json2=$(api_call "$url2")
      fi
      process_repos_page "$json2" "$lang"
    fi
    
    echo "  Running total: $TOTAL_NEW new domains" >&2
  done
done

# Also search org profiles directly
echo "=== Searching org profiles directly ===" >&2
log_progress "Direct org search"

for page in 1 2 3 4 5; do
  url="https://api.github.com/search/users?q=type:org+repos:%3E5+followers:%3E20&per_page=100&page=$page"
  json=$(api_call "$url")
  
  if echo "$json" | grep -q "API rate limit"; then
    sleep 65
    json=$(api_call "$url")
  fi
  
  # Extract org logins
  orgs=$(echo "$json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for item in data.get('items', []):
        print(item.get('login', ''))
except:
    pass
" 2>/dev/null)
  
  while read -r org_login; do
    [ -z "$org_login" ] && continue
    if grep -qxF "$org_login" "$SEEN_ORGS" 2>/dev/null; then
      continue
    fi
    echo "$org_login" >> "$SEEN_ORGS"
    
    org_json=$(api_call "https://api.github.com/orgs/$org_login")
    if echo "$org_json" | grep -q "API rate limit"; then
      sleep 65
      org_json=$(api_call "https://api.github.com/orgs/$org_login")
    fi
    
    result=$(echo "$org_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    blog = (data.get('blog') or '').strip()
    name = (data.get('name') or data.get('login') or '').strip()
    repos = data.get('public_repos', 0)
    print(f'{blog}\t{name}\t{repos}')
except:
    print('\t\t0')
" 2>/dev/null)
    
    site=$(echo "$result" | cut -f1)
    name=$(echo "$result" | cut -f2)
    repos=$(echo "$result" | cut -f3)
    
    [ -z "$site" ] && continue
    
    domain=$(clean_domain "$site")
    [ -z "$domain" ] && continue
    echo "$domain" | grep -q '\.' || continue
    echo "$domain" | grep -qE '\.github\.(io|com)$' && continue
    grep -qxF "$domain" "$SEEN_DOMAINS" 2>/dev/null && continue
    
    if grep -qxF "$domain" "$DEDUP_FILE" 2>/dev/null; then
      TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
      echo "$domain" >> "$SEEN_DOMAINS"
      continue
    fi
    
    echo "{\"domain\": \"$domain\", \"name\": \"$name\", \"source\": \"github\", \"category\": \"developer-tools\", \"metadata\": {\"stars\": 0, \"language\": \"mixed\", \"repos\": $repos, \"github_org\": \"$org_login\"}}" >> "$OUT_FILE"
    echo "$domain" >> "$SEEN_DOMAINS"
    TOTAL_NEW=$((TOTAL_NEW + 1))
    echo "  ✓ $domain ($name)" >&2
  done <<< "$orgs"
done

# Final progress
echo "" >> "$PROGRESS"
echo "## FINAL RESULTS" >> "$PROGRESS"
echo "- **New unique domains: $TOTAL_NEW**" >> "$PROGRESS"
echo "- Skipped (already in DB): $TOTAL_SKIPPED" >> "$PROGRESS"
echo "- No website found: $TOTAL_NO_SITE" >> "$PROGRESS"
echo "- Total API calls: $API_CALLS" >> "$PROGRESS"
echo "- Completed: $(date)" >> "$PROGRESS"

echo ""
echo "=== DONE ==="
echo "New domains: $TOTAL_NEW"
echo "Skipped (existing): $TOTAL_SKIPPED"
echo "No website: $TOTAL_NO_SITE"
echo "API calls: $API_CALLS"
echo "Output: $OUT_FILE"
