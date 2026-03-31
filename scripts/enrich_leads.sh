#!/bin/bash
# Enrichment runner - processes unenriched leads in batches of 20
BASE_URL="https://corgi-enrichment-production.up.railway.app"
TOTAL_PROCESSED=0
PAGE_OFFSET=0
PAGE_LIMIT=50
MAX_LEADS=500  # process up to 500 leads this run

echo "Starting enrichment run at $(date)"

while [ $TOTAL_PROCESSED -lt $MAX_LEADS ]; do
  # Fetch a page of unenriched leads
  RESPONSE=$(curl -s "${BASE_URL}/api/leads?enriched=false&limit=${PAGE_LIMIT}&offset=${PAGE_OFFSET}")
  
  # Extract IDs
  IDS=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
leads = data.get('leads', [])
total = data.get('total', 0)
ids = [l['id'] for l in leads]
print('TOTAL=' + str(total))
print('COUNT=' + str(len(ids)))
print('IDS=' + ','.join(ids))
")

  TOTAL=$(echo "$IDS" | grep '^TOTAL=' | cut -d= -f2)
  COUNT=$(echo "$IDS" | grep '^COUNT=' | cut -d= -f2)
  ID_LIST=$(echo "$IDS" | grep '^IDS=' | cut -d= -f2)

  echo "Fetched page at offset ${PAGE_OFFSET}: ${COUNT} leads (total unenriched: ${TOTAL})"

  if [ -z "$ID_LIST" ] || [ "$COUNT" -eq 0 ]; then
    echo "No more leads to process. Done."
    break
  fi

  # Split into batches of 20 and run enrichment
  echo "$ID_LIST" | tr ',' '\n' | while IFS= read -r id; do echo "$id"; done | \
  python3 -c "
import sys, json, subprocess

ids = [l.strip() for l in sys.stdin if l.strip()]
batch_size = 20
batches = [ids[i:i+batch_size] for i in range(0, len(ids), batch_size)]

print(f'Processing {len(ids)} leads in {len(batches)} batches of up to {batch_size}')

for i, batch in enumerate(batches):
    payload = json.dumps({'leadIds': batch})
    result = subprocess.run(
        ['curl', '-s', '-X', 'POST',
         'https://corgi-enrichment-production.up.railway.app/api/enrichment/batch',
         '-H', 'Content-Type: application/json',
         '-d', payload],
        capture_output=True, text=True, timeout=120
    )
    try:
        resp = json.loads(result.stdout)
        print(f'  Batch {i+1}/{len(batches)}: {resp}')
    except:
        print(f'  Batch {i+1}/{len(batches)}: raw={result.stdout[:200]}')
"

  TOTAL_PROCESSED=$((TOTAL_PROCESSED + COUNT))
  # Offset doesn't advance since we're always fetching unenriched=false (enriched ones drop off)
  echo "Total processed so far: ${TOTAL_PROCESSED}"

  # If we got fewer than limit, we're done
  if [ "$COUNT" -lt "$PAGE_LIMIT" ]; then
    echo "Last page reached. Done."
    break
  fi

  # Small pause to avoid hammering
  sleep 2
done

echo "Enrichment run complete at $(date). Total leads submitted: ${TOTAL_PROCESSED}"
