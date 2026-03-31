#!/bin/bash

API="https://corgi-enrichment-production.up.railway.app"
KEY="corgi-enrichment-2026"

LEADS=(
  "7ca71206-b308-486a-a387-cc9ecbbb0951:K4Connect"
  "bcc3c5ce-7718-4dd1-8393-10bab73d4634:August_Health"
  "0f8e972d-2680-4b33-bcc9-31ca53c004d0:Bold_Senior_Fitness"
  "4d5b8470-dda1-4d90-a979-f727ac7d26ae:VetVerifi"
  "d3c44fbe-e84d-4d52-9015-9175107fd6a1:Petcube"
  "13f33c5c-5318-4815-86e7-86ee35af237b:Spot_Pet_Insurance"
  "2994c356-3249-45f5-a9b1-515c78266f6c:Dutch_Veterinary_Telemedicine"
  "13a23706-d9fd-4ede-9294-283ee3bfd55c:Fi_Smart_Dog_Collar"
  "31d02ccf-5de2-40e2-9cec-14ed60d101b7:Pawlicy_Advisor"
  "56d34b88-a6c0-46ec-b708-2f91ceb5d213:Whisker"
  "eb96091d-94fc-4845-8f75-8a08fb2eb365:Ollie_Pets"
  "17a40689-10b3-4969-a03a-40bc704a24ff:The_Farmers_Dog"
  "4e9f6b53-fc83-4d96-afe1-c5b1532790f6:Wagmo"
  "72bd4308-9ec5-49b3-bd98-fbdfd1edd27e:Companion_Protect"
  "e881f4e8-42d8-4d36-8099-77a9566d8097:Sploot_Veterinary_Care"
  "cb8665d1-6637-440b-8f58-2ad4911a012a:Loyal"
  "dbd1502c-6ca0-4398-b6db-48bd4b3b7913:MoeGo"
  "61d49b7f-1198-4478-9850-e09f9d9a30cc:Digitail"
  "95cab321-5870-4317-bca0-b2a6396c604d:Banyan_Security"
  "e823d74d-3045-4e5c-8ce8-87152f0641b6:AppOmni"
  "a77fdadb-dcfe-4ac1-ad66-3ba65eeae619:Codenotary"
  "cc1938d4-c1f5-44d6-ab5e-603b13a498d3:Sotero"
  "e8804945-b806-4574-87ec-0f8302e6ff54:Cybereason"
  "10d818d5-5564-4a2e-8efb-b340f68102e1:Silverfort"
  "f437d13b-e9a0-41ed-8c07-cbf487fb9ed5:Grip_Security"
  "c9d2dab8-9fa9-4196-aa3c-cab6c82e6973:Nile"
  "06fdb61a-aafe-46df-a1b8-e8dfd54bfe01:Halcyon"
  "0a1d6b14-8123-4b2c-a77c-84028654e5ba:Pentera"
  "2b396f00-d53e-4ebf-9bc3-71c72977e887:Talon_Cyber_Security"
  "89b68ed9-71f0-4232-a1b5-681f14afbe91:Arnica"
)

SUCCESS=0
FAILED=0
TOTAL_COMPLETENESS=0

for entry in "${LEADS[@]}"; do
  ID="${entry%%:*}"
  NAME="${entry##*:}"
  
  echo "[$((SUCCESS+FAILED+1))/30] Enriching $NAME ($ID)..."
  
  # Try up to 2 times
  for attempt in 1 2; do
    RESULT=$(curl -s --max-time 90 -X POST "$API/api/enrichment/lead/$ID" \
      -H "X-API-Key: $KEY")
    
    if [ $? -eq 0 ] && [ -n "$RESULT" ]; then
      # Check for error
      ERROR=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
      if [ -n "$ERROR" ] && [ "$ERROR" != "None" ] && [ "$ERROR" != "" ]; then
        echo "  ❌ Error: $ERROR"
        if [ $attempt -eq 2 ]; then
          FAILED=$((FAILED+1))
        fi
      else
        COMPLETENESS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('enrichment_completeness', d.get('completeness', 0)))" 2>/dev/null)
        echo "  ✅ Done. Completeness: $COMPLETENESS"
        SUCCESS=$((SUCCESS+1))
        TOTAL_COMPLETENESS=$(python3 -c "print($TOTAL_COMPLETENESS + $COMPLETENESS)")
        break
      fi
    else
      echo "  ⚠️  Attempt $attempt failed/timeout"
      if [ $attempt -eq 2 ]; then
        FAILED=$((FAILED+1))
      fi
    fi
  done
done

echo ""
echo "==============================="
echo "ENRICHMENT BATCH 7 COMPLETE"
echo "==============================="
echo "Enriched: $SUCCESS / $((SUCCESS+FAILED))"
echo "Failed:   $FAILED"
if [ $SUCCESS -gt 0 ]; then
  AVG=$(python3 -c "print(round($TOTAL_COMPLETENESS / $SUCCESS, 2))")
  echo "Avg completeness: $AVG"
fi
