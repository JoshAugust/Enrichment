#!/bin/bash
# Usage: ./update_db.sh <domain> <employee_count>
DB="/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/pipeline/master.db"
DOMAIN="$1"
EMP="$2"

sqlite3 "$DB" "PRAGMA journal_mode=WAL; UPDATE companies SET linkedin_employees = $EMP WHERE domain = '$DOMAIN';"
echo "Updated $DOMAIN → $EMP employees"
