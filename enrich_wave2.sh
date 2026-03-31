#!/bin/bash

BASE_URL="https://corgi-enrichment-production.up.railway.app"
API_KEY="corgi-enrichment-2026"
LOG="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG_V2.md"
BATCH_SIZE=20
PAGE_SIZE=100

echo "=== Wave 2 Enrichment Runner ==="
echo "=== Fetching all leads to identify unenriched ==="

# Collect all unenriched lead IDs (last_enriched_at is null)
all_ids=()
offset=0
total_fetched=0

# First, get total count
total=$(curl -s "${BASE_URL}/api/leads?limit=1&offset=0" -H "X-API-Key: ${API_KEY}" | jq '.total')
echo "Total leads in DB: $total"

while [ "$offset" -lt "$total" ]; do
  response=$(curl -s "${BASE_URL}/api/leads?limit=${PAGE_SIZE}&offset=${offset}" \
    -H "X-API-Key: ${API_KEY}")
  
  # Extract IDs where last_enriched_at is null (unenriched)
  ids=$(echo "$response" | jq -r '.leads[] | select(.last_enriched_at == null) | .id')
  
  if [ -n "$ids" ]; then
    while IFS= read -r id; do
      all_ids+=("$id")
    done <<< "$ids"
  fi
  
  total_fetched=$((total_fetched + PAGE_SIZE))
  offset=$((offset + PAGE_SIZE))
  echo "  Scanned offset $((offset - PAGE_SIZE)), unenriched found so far: ${#all_ids[@]}"
  sleep 1
done

echo ""
echo "Total unenriched leads found: ${#all_ids[@]}"
echo "" >> "$LOG"
echo "### Phase 1: Unenriched Lead IDs Found: ${#all_ids[@]}" >> "$LOG"
echo "" >> "$LOG"

# Process in batches of 20
batch_num=0
processed=0
total_queued=0
total_unenriched=${#all_ids[@]}

for ((i=0; i<total_unenriched; i+=BATCH_SIZE)); do
  batch_num=$((batch_num + 1))
  batch=("${all_ids[@]:$i:$BATCH_SIZE}")
  
  # Build JSON array of IDs
  ids_json=$(printf '%s\n' "${batch[@]}" | jq -R . | jq -s .)
  payload=$(jq -n --argjson ids "$ids_json" '{"leadIds": $ids, "force": false}')
  
  echo "Batch $batch_num/${CEIL}: submitting ${#batch[@]} leads..."
  
  response=$(curl -s -X POST "${BASE_URL}/api/enrichment/batch" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "$payload")
  
  queued=$(echo "$response" | jq '.queued // 0')
  errors=$(echo "$response" | jq '.errors // 0')
  
  echo "  → Queued: $queued, Errors: $errors"
  echo "- **Batch $batch_num** (offset $i): ${#batch[@]} leads — queued=$queued errors=$errors" >> "$LOG"
  
  processed=$((processed + ${#batch[@]}))
  total_queued=$((total_queued + queued))
  
  sleep 3
done

echo "" >> "$LOG"
echo "### Phase 1 Complete" >> "$LOG"
echo "- Batches submitted: $batch_num" >> "$LOG"
echo "- Total processed: $processed" >> "$LOG"
echo "- Total queued successfully: $total_queued" >> "$LOG"

echo ""
echo "=== Phase 1 done: $batch_num batches, $total_queued leads queued ==="
echo "Waiting 45s for enrichment to process before Phase 2..."
sleep 45

# Phase 2: Re-enrich low-completeness leads (< 30%) with force=true
echo "" >> "$LOG"
echo "## Phase 2: Re-enrich low-completeness leads (< 30%)" >> "$LOG"
echo "" >> "$LOG"

low_ids=()
offset=0
total=$(curl -s "${BASE_URL}/api/leads?limit=1&offset=0" -H "X-API-Key: ${API_KEY}" | jq '.total')

while [ "$offset" -lt "$total" ]; do
  response=$(curl -s "${BASE_URL}/api/leads?limit=${PAGE_SIZE}&offset=${offset}" \
    -H "X-API-Key: ${API_KEY}")
  
  ids=$(echo "$response" | jq -r '.leads[] | select(.enrichment_completeness != null and .enrichment_completeness < 30) | .id')
  
  if [ -n "$ids" ]; then
    while IFS= read -r id; do
      low_ids+=("$id")
    done <<< "$ids"
  fi
  
  offset=$((offset + PAGE_SIZE))
  echo "  Phase 2 scan offset $((offset - PAGE_SIZE)), low-completeness found: ${#low_ids[@]}"
  sleep 1
done

echo "Low-completeness leads (< 30%): ${#low_ids[@]}"
echo "### Low-completeness leads found: ${#low_ids[@]}" >> "$LOG"
echo "" >> "$LOG"

batch_num2=0
processed2=0
total_low=${#low_ids[@]}

for ((i=0; i<total_low; i+=BATCH_SIZE)); do
  batch_num2=$((batch_num2 + 1))
  batch=("${low_ids[@]:$i:$BATCH_SIZE}")
  
  ids_json=$(printf '%s\n' "${batch[@]}" | jq -R . | jq -s .)
  payload=$(jq -n --argjson ids "$ids_json" '{"leadIds": $ids, "force": true}')
  
  echo "Force-batch $batch_num2: ${#batch[@]} leads..."
  
  response=$(curl -s -X POST "${BASE_URL}/api/enrichment/batch" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "$payload")
  
  queued=$(echo "$response" | jq '.queued // 0')
  errors=$(echo "$response" | jq '.errors // 0')
  
  echo "  → Queued: $queued, Errors: $errors"
  echo "- **Force-batch $batch_num2** (offset $i): ${#batch[@]} leads — queued=$queued errors=$errors" >> "$LOG"
  
  processed2=$((processed2 + ${#batch[@]}))
  
  sleep 3
done

echo "" >> "$LOG"
echo "### Phase 2 Complete" >> "$LOG"
echo "- Force batches: $batch_num2" >> "$LOG"
echo "- Low-completeness leads re-queued: $processed2" >> "$LOG"

echo ""
echo "=== Phase 2 done: $batch_num2 force batches, $processed2 leads re-queued ==="

# Phase 3: Final Scoring
echo ""
echo "=== Triggering final scoring ==="
echo "" >> "$LOG"
echo "## Phase 3: Final Scoring" >> "$LOG"

score_response=$(curl -s -X POST "${BASE_URL}/api/scoring" -H "X-API-Key: ${API_KEY}")
echo "Scoring response: $score_response"
echo "- Response: $score_response" >> "$LOG"

# Final stats (give it a few seconds)
sleep 10
echo ""
echo "=== Final Stats ==="
final_stats=$(curl -s "${BASE_URL}/api/leads/stats" -H "X-API-Key: ${API_KEY}")
echo "$final_stats" | jq .

avg_after=$(echo "$final_stats" | jq '.enrichment.avgCompleteness')
enriched_after=$(echo "$final_stats" | jq '.enrichment.enrichedCount')
unenriched_after=$(echo "$final_stats" | jq '.enrichment.unenrichedCount')

echo "" >> "$LOG"
echo "## Final Stats" >> "$LOG"
echo "| Metric | Before | After |" >> "$LOG"
echo "|--------|--------|-------|" >> "$LOG"
echo "| Avg completeness | 26% | ${avg_after}% |" >> "$LOG"
echo "| Enriched count | 936 | $enriched_after |" >> "$LOG"
echo "| Unenriched count | 838 | $unenriched_after |" >> "$LOG"
echo "" >> "$LOG"
echo "**Wave 2 enrichment run complete. $(date)**" >> "$LOG"

echo ""
echo "=============================="
echo "FINAL SUMMARY:"
echo "  Leads enriched (Phase 1): $processed"
echo "  Low-completeness re-enriched (Phase 2): $processed2"
echo "  Avg completeness: 26% → ${avg_after}%"
echo "  Enriched count: 936 → $enriched_after"
echo "  Unenriched remaining: $unenriched_after"
echo "=============================="
