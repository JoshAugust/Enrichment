#!/bin/bash
# Resilient batch enrichment - runs to completion
# Usage: bash collect_and_enrich.sh [phase1|phase2|scoring]

BASE_URL="https://corgi-enrichment-production.up.railway.app"
API_KEY="corgi-enrichment-2026"
LOG="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG_V2.md"
BATCH_SIZE=20
PAGE_SIZE=100
PHASE="${1:-phase1}"

log() { echo "$1" | tee -a "$LOG"; }

if [ "$PHASE" = "phase1" ]; then
  log ""
  log "## Phase 1 (Resumed) — $(date)"
  
  # Collect all unenriched lead IDs
  echo "Collecting unenriched lead IDs..."
  total=$(curl -s "${BASE_URL}/api/leads?limit=1" -H "X-API-Key: ${API_KEY}" | jq '.total')
  echo "Total leads: $total"
  
  all_ids=()
  for ((offset=0; offset<total; offset+=PAGE_SIZE)); do
    response=$(curl -s "${BASE_URL}/api/leads?limit=${PAGE_SIZE}&offset=${offset}" -H "X-API-Key: ${API_KEY}")
    ids=$(echo "$response" | jq -r '.leads[] | select(.last_enriched_at == null) | .id')
    if [ -n "$ids" ]; then
      while IFS= read -r id; do all_ids+=("$id"); done <<< "$ids"
    fi
    sleep 0.5
  done
  
  total_ids=${#all_ids[@]}
  echo "Unenriched leads found: $total_ids"
  log "### Unenriched leads to process: $total_ids"
  
  batch=0
  for ((i=0; i<total_ids; i+=BATCH_SIZE)); do
    batch=$((batch+1))
    chunk=("${all_ids[@]:$i:$BATCH_SIZE}")
    ids_json=$(printf '%s\n' "${chunk[@]}" | jq -R . | jq -s .)
    payload=$(jq -n --argjson ids "$ids_json" '{"leadIds":$ids,"force":false}')
    
    resp=$(curl -s -X POST "${BASE_URL}/api/enrichment/batch" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${API_KEY}" \
      -d "$payload")
    
    succeeded=$(echo "$resp" | jq '.succeeded // 0' 2>/dev/null || echo "?")
    failed=$(echo "$resp" | jq '.failed // 0' 2>/dev/null || echo "?")
    echo "  Batch $batch: ${#chunk[@]} leads → succeeded=$succeeded failed=$failed"
    log "- Batch $batch (i=$i): ${#chunk[@]} leads — succeeded=$succeeded failed=$failed"
    sleep 3
  done
  
  log "### Phase 1 done: $batch batches, $total_ids leads submitted"

elif [ "$PHASE" = "phase2" ]; then
  log ""
  log "## Phase 2 — Force re-enrich low completeness (<30%) — $(date)"
  
  total=$(curl -s "${BASE_URL}/api/leads?limit=1" -H "X-API-Key: ${API_KEY}" | jq '.total')
  
  low_ids=()
  for ((offset=0; offset<total; offset+=PAGE_SIZE)); do
    response=$(curl -s "${BASE_URL}/api/leads?limit=${PAGE_SIZE}&offset=${offset}" -H "X-API-Key: ${API_KEY}")
    ids=$(echo "$response" | jq -r '.leads[] | select(.enrichment_completeness != null and .enrichment_completeness > 0 and .enrichment_completeness < 30) | .id')
    if [ -n "$ids" ]; then
      while IFS= read -r id; do low_ids+=("$id"); done <<< "$ids"
    fi
    sleep 0.5
  done
  
  total_low=${#low_ids[@]}
  echo "Low-completeness leads (<30%): $total_low"
  log "### Low-completeness leads: $total_low"
  
  batch=0
  for ((i=0; i<total_low; i+=BATCH_SIZE)); do
    batch=$((batch+1))
    chunk=("${low_ids[@]:$i:$BATCH_SIZE}")
    ids_json=$(printf '%s\n' "${chunk[@]}" | jq -R . | jq -s .)
    payload=$(jq -n --argjson ids "$ids_json" '{"leadIds":$ids,"force":true}')
    
    resp=$(curl -s -X POST "${BASE_URL}/api/enrichment/batch" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: ${API_KEY}" \
      -d "$payload")
    
    succeeded=$(echo "$resp" | jq '.succeeded // 0' 2>/dev/null || echo "?")
    failed=$(echo "$resp" | jq '.failed // 0' 2>/dev/null || echo "?")
    echo "  Force-batch $batch: ${#chunk[@]} leads → succeeded=$succeeded failed=$failed"
    log "- Force-batch $batch (i=$i): ${#chunk[@]} leads — succeeded=$succeeded failed=$failed"
    sleep 3
  done
  
  log "### Phase 2 done: $batch batches, $total_low leads re-enriched"

elif [ "$PHASE" = "scoring" ]; then
  log ""
  log "## Final Scoring — $(date)"
  resp=$(curl -s -X POST "${BASE_URL}/api/scoring" -H "X-API-Key: ${API_KEY}")
  echo "Scoring: $resp"
  log "- Scoring response: $resp"
  
  sleep 5
  stats=$(curl -s "${BASE_URL}/api/leads/stats" -H "X-API-Key: ${API_KEY}")
  avg=$(echo "$stats" | jq '.enrichment.avgCompleteness')
  enriched=$(echo "$stats" | jq '.enrichment.enrichedCount')
  unenriched=$(echo "$stats" | jq '.enrichment.unenrichedCount')
  
  log ""
  log "## Final Stats"
  log "| Metric | Before Wave 2 | After Wave 2 |"
  log "|--------|--------------|--------------|"
  log "| Avg completeness | 26% | ${avg}% |"
  log "| Enriched count | 936 | $enriched |"
  log "| Unenriched count | 838 | $unenriched |"
  log ""
  log "**Wave 2 complete. $(date)**"
  
  echo ""
  echo "FINAL: avg=$avg% enriched=$enriched unenriched=$unenriched"
fi
