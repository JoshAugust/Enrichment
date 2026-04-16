#!/bin/bash
set -euo pipefail

WORKSPACE="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
DEDUP_FILE="$WORKSPACE/jordan.ai/sourcing/shared/existing_domains.txt"
OUT_FILE="$WORKSPACE/jordan.ai/sourcing/wave1/github_domains.jsonl"
PROGRESS="$WORKSPACE/jordan.ai/sourcing/logs/github_progress.md"
SEEN_ORGS="$WORKSPACE/jordan.ai/sourcing/wave1/.seen_orgs.txt"
SEEN_DOMAINS="$WORKSPACE/jordan.ai/sourcing/wave1/.seen_domains.txt"

# Preserve existing results but rebuild seen lists from them
if [ -f "$OUT_FILE" ]; then
  python3 -c "
import json, sys
orgs = set(); domains = set()
for line in open('$OUT_FILE'):
    try:
        d = json.loads(line)
        domains.add(d['domain'])
        orgs.add(d['metadata']['github_org'])
    except: pass
with open('$SEEN_ORGS','w') as f:
    f.write('\n'.join(orgs) + '\n')
with open('$SEEN_DOMAINS','w') as f:
    f.write('\n'.join(domains) + '\n')
print(f'Loaded {len(domains)} existing domains, {len(orgs)} orgs')
"
else
  > "$OUT_FILE"
  > "$SEEN_ORGS"
  > "$SEEN_DOMAINS"
fi

echo "# GitHub Domain Harvest Progress (v2 - Authenticated)" > "$PROGRESS"
echo "Started: $(date)" >> "$PROGRESS"
echo "" >> "$PROGRESS"

TOTAL_NEW=$(wc -l < "$OUT_FILE")
TOTAL_SKIPPED=0
TOTAL_NO_SITE=0
API_CALLS=0

# Use gh api for authenticated requests (5000/hr)
ghapi() {
  API_CALLS=$((API_CALLS + 1))
  # 2 second delay = ~30 req/min, well within 83 req/min limit
  sleep 2
  gh api "$@" 2>/dev/null || echo "{}"
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

process_repos() {
  local json="$1"
  local lang="$2"
  
  # Use python to extract orgs and process them in batch
  echo "$json" | python3 -c "
import json, sys
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
" 2>/dev/null | while IFS=$'\t' read -r org_login stars; do
    [ -z "$org_login" ] && continue
    
    # Skip already processed
    if grep -qxF "$org_login" "$SEEN_ORGS" 2>/dev/null; then
      continue
    fi
    echo "$org_login" >> "$SEEN_ORGS"
    
    # Fetch org profile using authenticated API
    local org_json
    org_json=$(ghapi "/orgs/$org_login")
    
    # Extract domain
    local result
    result=$(echo "$org_json" | python3 -c "
import json, sys, re
data = json.load(sys.stdin)
blog = (data.get('blog') or '').strip()
name = (data.get('name') or data.get('login') or '').strip()
repos = data.get('public_repos', 0)

# Clean domain
domain = blog
domain = re.sub(r'^https?://', '', domain)
domain = re.sub(r'^www\.', '', domain)
domain = domain.split('/')[0].split(':')[0].lower().strip()

# Validate
if not domain or '.' not in domain or domain.endswith('.github.io') or domain.endswith('.github.com'):
    domain = ''

# Escape quotes in name for JSON
name = name.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
print(f'{domain}\t{name}\t{repos}')
" 2>/dev/null)
    
    local domain name repos
    domain=$(echo "$result" | cut -f1)
    name=$(echo "$result" | cut -f2)
    repos=$(echo "$result" | cut -f3)
    
    if [ -z "$domain" ]; then
      TOTAL_NO_SITE=$((TOTAL_NO_SITE + 1))
      continue
    fi
    
    # Skip if already seen
    if grep -qxF "$domain" "$SEEN_DOMAINS" 2>/dev/null; then
      continue
    fi
    
    # Skip if in dedup
    if grep -qxF "$domain" "$DEDUP_FILE" 2>/dev/null; then
      TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
      echo "$domain" >> "$SEEN_DOMAINS"
      continue
    fi
    
    # Write immediately
    python3 -c "
import json
print(json.dumps({
    'domain': '$domain',
    'name': '''$name'''.replace(\"'''\", ''),
    'source': 'github',
    'category': 'developer-tools',
    'metadata': {
        'stars': int('$stars' or '0'),
        'language': '$lang',
        'repos': int('$repos' or '0'),
        'github_org': '$org_login'
    }
}))
" >> "$OUT_FILE" 2>/dev/null
    
    echo "$domain" >> "$SEEN_DOMAINS"
    TOTAL_NEW=$((TOTAL_NEW + 1))
    echo "  ✓ $domain ($name) - ${stars}★" >&2
  done
}

# Search matrix
LANGUAGES=("javascript" "typescript" "python" "go" "rust" "ruby" "java" "kotlin" "swift" "cpp" "csharp" "php" "scala" "elixir" "haskell" "dart" "zig" "nim" "lua" "r")
STAR_RANGES=("50..200" "200..500" "500..1000" "1000..2000" "2000..5000")
DATE_RANGES=("2025-01-01" "2024-06-01" "2024-01-01")

for lang in "${LANGUAGES[@]}"; do
  for star_range in "${STAR_RANGES[@]}"; do
    for date_cutoff in "${DATE_RANGES[@]}"; do
      echo "=== $lang | stars:$star_range | pushed>$date_cutoff ===" >&2
      log_progress "$lang | stars:$star_range | pushed>$date_cutoff"
      
      for page in 1 2 3; do
        url="/search/repositories?q=stars:${star_range}+language:${lang}+pushed:>${date_cutoff}&sort=stars&per_page=100&page=${page}"
        json=$(ghapi "$url")
        
        total=$(echo "$json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_count',0))" 2>/dev/null || echo "0")
        
        if [ "$page" -eq 1 ]; then
          echo "  Results: $total" >&2
        fi
        
        process_repos "$json" "$lang"
        
        # Don't fetch more pages if not needed
        if [ "$total" -le $((page * 100)) ]; then
          break
        fi
        
        # GitHub search API: max 10 pages
        if [ "$page" -ge 10 ]; then
          break
        fi
      done
      
      echo "  Running total: $TOTAL_NEW domains" >&2
    done
  done
done

# Direct org search with various queries
echo "=== Direct org searches ===" >&2
ORG_QUERIES=(
  "type:org+repos:>10+followers:>50"
  "type:org+repos:>20+followers:>20"
  "type:org+repos:>5+followers:>100"
  "type:org+created:>2023-01-01+repos:>3"
  "type:org+location:san+francisco+repos:>5"
  "type:org+location:new+york+repos:>5"
  "type:org+location:london+repos:>5"
  "type:org+location:berlin+repos:>5"
  "type:org+location:singapore+repos:>3"
  "type:org+location:tel+aviv+repos:>3"
)

for query in "${ORG_QUERIES[@]}"; do
  echo "=== Org search: $query ===" >&2
  log_progress "Org search: $query"
  
  for page in 1 2 3 4 5; do
    json=$(ghapi "/search/users?q=${query}&per_page=100&page=${page}")
    
    count=$(echo "$json" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('items',[])))" 2>/dev/null || echo "0")
    [ "$count" -eq 0 ] && break
    
    echo "$json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    print(item.get('login', ''))
" 2>/dev/null | while read -r org_login; do
      [ -z "$org_login" ] && continue
      grep -qxF "$org_login" "$SEEN_ORGS" 2>/dev/null && continue
      echo "$org_login" >> "$SEEN_ORGS"
      
      org_json=$(ghapi "/orgs/$org_login")
      
      result=$(echo "$org_json" | python3 -c "
import json, sys, re
data = json.load(sys.stdin)
blog = (data.get('blog') or '').strip()
name = (data.get('name') or data.get('login') or '').strip()
repos = data.get('public_repos', 0)
domain = blog
domain = re.sub(r'^https?://', '', domain)
domain = re.sub(r'^www\.', '', domain)
domain = domain.split('/')[0].split(':')[0].lower().strip()
if not domain or '.' not in domain or domain.endswith('.github.io') or domain.endswith('.github.com'):
    domain = ''
name = name.replace('\\\\','\\\\\\\\').replace('\"','\\\\\"')
print(f'{domain}\t{name}\t{repos}')
" 2>/dev/null)
      
      domain=$(echo "$result" | cut -f1)
      name=$(echo "$result" | cut -f2)
      repos=$(echo "$result" | cut -f3)
      
      [ -z "$domain" ] && continue
      echo "$domain" | grep -q '\.' || continue
      grep -qxF "$domain" "$SEEN_DOMAINS" 2>/dev/null && continue
      
      if grep -qxF "$domain" "$DEDUP_FILE" 2>/dev/null; then
        TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
        echo "$domain" >> "$SEEN_DOMAINS"
        continue
      fi
      
      python3 -c "
import json
print(json.dumps({
    'domain': '$domain',
    'name': '''$name''',
    'source': 'github',
    'category': 'developer-tools',
    'metadata': {'stars': 0, 'language': 'mixed', 'repos': int('$repos' or '0'), 'github_org': '$org_login'}
}))
" >> "$OUT_FILE" 2>/dev/null
      echo "$domain" >> "$SEEN_DOMAINS"
      TOTAL_NEW=$((TOTAL_NEW + 1))
      echo "  ✓ $domain ($name)" >&2
    done
  done
done

# Final
echo "" >> "$PROGRESS"
echo "## FINAL RESULTS" >> "$PROGRESS"
echo "- **New unique domains: $TOTAL_NEW**" >> "$PROGRESS"
echo "- Skipped (already in DB): $TOTAL_SKIPPED" >> "$PROGRESS"
echo "- No website: $TOTAL_NO_SITE" >> "$PROGRESS"
echo "- Total API calls: $API_CALLS" >> "$PROGRESS"
echo "- Completed: $(date)" >> "$PROGRESS"

echo ""
echo "=== DONE ==="
echo "New domains: $TOTAL_NEW"
echo "Skipped: $TOTAL_SKIPPED"
echo "No website: $TOTAL_NO_SITE"
echo "API calls: $API_CALLS"
