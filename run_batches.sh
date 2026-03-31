#!/bin/bash
# Reads IDs from unenriched_ids.txt and submits enrichment batches
# Uses long curl timeout to handle slow API

BASE_URL="https://corgi-enrichment-production.up.railway.app"
API_KEY="corgi-enrichment-2026"
IDS_FILE="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/unenriched_ids.txt"
LOG="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG_V2.md"
BATCH_SIZE=20
FORCE="${1:-false}"
LABEL="${2:-Phase1}"

# Read all IDs into array
mapfile -t ids < "$IDS_FILE"
total=${#ids[@]}
echo "[$LABEL] Processing $total IDs from $IDS_FILE (force=$FORCE)"
echo "" >> "$LOG"
echo "## $LABEL — $(date)" >> "$LOG"
echo "### IDs to process: $total (force=$FORCE)" >> "$LOG"
echo "" >> "$LOG"

batch=0
total_succeeded=0
total_failed=0

for ((i=0; i<total; i+=BATCH_SIZE)); do
  batch=$((batch + 1))
  
  # Build batch array
  end=$((i + BATCH_SIZE))
  if [ $end -gt $total ]; then end=$total; fi
  chunk=("${ids[@]:$i:$((end - i))}")
  size=${#chunk[@]}
  
  # Build JSON payload using printf
  ids_json=$(printf '"%s",' "${chunk[@]}")
  ids_json="[${ids_json%,}]"
  payload="{\"leadIds\":${ids_json},\"force\":${FORCE}}"
  
  echo "  Batch $batch: $size leads (i=$i)..."
  
  resp=$(curl -s --max-time 600 -X POST "${BASE_URL}/api/enrichment/batch" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "$payload")
  
  if [ $? -ne 0 ] || [ -z "$resp" ]; then
    echo "  → ERROR: no response or curl failed"
    echo "- Batch $batch (i=$i): $size leads — ERROR (no response)" >> "$LOG"
    sleep 5
    continue
  fi
  
  succeeded=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('succeeded',0))" 2>/dev/null || echo "?")
  failed=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('failed',0))" 2>/dev/null || echo "?")
  processed=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('processed',0))" 2>/dev/null || echo "?")
  
  echo "  → succeeded=$succeeded failed=$failed processed=$processed"
  echo "- Batch $batch (i=$i): $size leads — succeeded=$succeeded failed=$failed processed=$processed" >> "$LOG"
  
  if [[ "$succeeded" =~ ^[0-9]+$ ]]; then
    total_succeeded=$((total_succeeded + succeeded))
  fi
  if [[ "$failed" =~ ^[0-9]+$ ]]; then
    total_failed=$((total_failed + failed))
  fi
  
  sleep 3
done

echo ""
echo "[$LABEL] Done: $batch batches, $total_succeeded succeeded, $total_failed failed"
echo "" >> "$LOG"
echo "### $LABEL Complete: $batch batches, $total_succeeded succeeded, $total_failed failed" >> "$LOG"
