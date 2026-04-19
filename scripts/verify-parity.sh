#!/usr/bin/env bash
# Row-count parity verification between Neon (source) and Supabase (target).
#
# Part of Sprint 0 migration — used during the cutover window in §7.2 of
# docs/infra/supabase-migration-runbook.md.
#
# Usage:
#   NEON_URL=postgresql://... SUPA_URL=postgresql://... ./scripts/verify-parity.sh
#   # or
#   ./scripts/verify-parity.sh --neon=$NEON_URL --supa=$SUPA_URL
#
# Exit codes:
#   0 — all tables match
#   1 — drift detected
#   2 — configuration/connection error

set -euo pipefail

NEON_URL="${NEON_URL:-}"
SUPA_URL="${SUPA_URL:-}"
JSON_OUT=""
FAIL_ON_DRIFT=1
SCHEMA="public"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --neon=*) NEON_URL="${1#*=}"; shift;;
    --supa=*) SUPA_URL="${1#*=}"; shift;;
    --schema=*) SCHEMA="${1#*=}"; shift;;
    --json=*) JSON_OUT="${1#*=}"; shift;;
    --warn-only) FAIL_ON_DRIFT=0; shift;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

if [[ -z "$NEON_URL" || -z "$SUPA_URL" ]]; then
  echo "ERROR: NEON_URL and SUPA_URL required (env vars or --neon= --supa= flags)" >&2
  exit 2
fi

# Colors (disabled if not TTY)
if [[ -t 1 ]]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; DIM=""; BOLD=""; RESET=""
fi

echo "${BOLD}=== Row-count parity check ===${RESET}"
echo "  Schema:   $SCHEMA"
echo "  Neon:     ${NEON_URL%%@*}@…"
echo "  Supabase: ${SUPA_URL%%@*}@…"
echo ""

# Connectivity probe
psql "$NEON_URL" -Atqc "SELECT 1;" >/dev/null 2>&1 \
  || { echo "${RED}✗${RESET} Cannot connect to Neon"; exit 2; }
psql "$SUPA_URL" -Atqc "SELECT 1;" >/dev/null 2>&1 \
  || { echo "${RED}✗${RESET} Cannot connect to Supabase"; exit 2; }

# List all tables in the target schema from each side, union'd
NEON_TABLES=$(psql "$NEON_URL" -Atqc "
  SELECT tablename FROM pg_tables
  WHERE schemaname = '$SCHEMA'
  ORDER BY tablename;
")
SUPA_TABLES=$(psql "$SUPA_URL" -Atqc "
  SELECT tablename FROM pg_tables
  WHERE schemaname = '$SCHEMA'
  ORDER BY tablename;
")

ALL_TABLES=$(printf "%s\n%s\n" "$NEON_TABLES" "$SUPA_TABLES" | sort -u | grep -v '^$')

printf "${BOLD}%-40s %15s %15s %12s${RESET}\n" "Table" "Neon" "Supabase" "Delta"
printf "%-40s %15s %15s %12s\n" "---------------------------------------" "---------------" "---------------" "------------"

MATCHED=0
DRIFTED=0
MISSING_TARGET=0
MISSING_SOURCE=0
declare -a DRIFT_ROWS=()

# Build JSON accumulator if requested
if [[ -n "$JSON_OUT" ]]; then
  echo "[" > "$JSON_OUT"
  JSON_FIRST=1
fi

while IFS= read -r tbl; do
  [[ -z "$tbl" ]] && continue

  NEON_COUNT=""
  SUPA_COUNT=""

  if echo "$NEON_TABLES" | grep -qFx "$tbl"; then
    NEON_COUNT=$(psql "$NEON_URL" -Atqc "SELECT COUNT(*) FROM $SCHEMA.\"$tbl\";" 2>/dev/null || echo "ERR")
  fi
  if echo "$SUPA_TABLES" | grep -qFx "$tbl"; then
    SUPA_COUNT=$(psql "$SUPA_URL" -Atqc "SELECT COUNT(*) FROM $SCHEMA.\"$tbl\";" 2>/dev/null || echo "ERR")
  fi

  if [[ -z "$NEON_COUNT" ]]; then
    printf "%-40s %15s %15s %12s\n" "$tbl" "${DIM}(missing)${RESET}" "$SUPA_COUNT" "${YELLOW}SOURCE-MISSING${RESET}"
    MISSING_SOURCE=$((MISSING_SOURCE + 1))
    STATUS="source-missing"
    DELTA=""
  elif [[ -z "$SUPA_COUNT" ]]; then
    printf "%-40s %15s %15s %12s\n" "$tbl" "$NEON_COUNT" "${DIM}(missing)${RESET}" "${RED}TARGET-MISSING${RESET}"
    MISSING_TARGET=$((MISSING_TARGET + 1))
    DRIFT_ROWS+=("$tbl: target missing")
    STATUS="target-missing"
    DELTA=""
  elif [[ "$NEON_COUNT" == "ERR" || "$SUPA_COUNT" == "ERR" ]]; then
    printf "%-40s %15s %15s %12s\n" "$tbl" "$NEON_COUNT" "$SUPA_COUNT" "${RED}QUERY-ERR${RESET}"
    DRIFTED=$((DRIFTED + 1))
    DRIFT_ROWS+=("$tbl: query error")
    STATUS="error"
    DELTA=""
  elif [[ "$NEON_COUNT" == "$SUPA_COUNT" ]]; then
    printf "%-40s %15s %15s %12s\n" "$tbl" "$NEON_COUNT" "$SUPA_COUNT" "${GREEN}✓${RESET}"
    MATCHED=$((MATCHED + 1))
    STATUS="match"
    DELTA=0
  else
    DELTA=$((SUPA_COUNT - NEON_COUNT))
    printf "%-40s %15s %15s %12s\n" "$tbl" "$NEON_COUNT" "$SUPA_COUNT" "${RED}Δ${DELTA}${RESET}"
    DRIFTED=$((DRIFTED + 1))
    DRIFT_ROWS+=("$tbl: Δ=${DELTA} (neon=$NEON_COUNT supa=$SUPA_COUNT)")
    STATUS="drift"
  fi

  if [[ -n "$JSON_OUT" ]]; then
    if [[ $JSON_FIRST -eq 1 ]]; then
      JSON_FIRST=0
    else
      echo "," >> "$JSON_OUT"
    fi
    cat <<EOF >> "$JSON_OUT"
  {"table":"$tbl","neon":"${NEON_COUNT:-null}","supabase":"${SUPA_COUNT:-null}","status":"$STATUS","delta":"${DELTA:-null}"}
EOF
  fi
done <<< "$ALL_TABLES"

if [[ -n "$JSON_OUT" ]]; then
  echo "" >> "$JSON_OUT"
  echo "]" >> "$JSON_OUT"
fi

echo ""
echo "${BOLD}Summary:${RESET}"
echo "  ${GREEN}Matched:${RESET}         $MATCHED"
echo "  ${RED}Drifted:${RESET}         $DRIFTED"
echo "  ${RED}Missing in target:${RESET} $MISSING_TARGET"
echo "  ${YELLOW}Missing in source:${RESET} $MISSING_SOURCE  ${DIM}(new tables in Supabase — usually fine)${RESET}"

TOTAL_ISSUES=$((DRIFTED + MISSING_TARGET))
if [[ $TOTAL_ISSUES -gt 0 ]]; then
  echo ""
  echo "${RED}${BOLD}Issues:${RESET}"
  for row in "${DRIFT_ROWS[@]}"; do
    echo "  • $row"
  done
fi

if [[ -n "$JSON_OUT" ]]; then
  echo ""
  echo "JSON report → $JSON_OUT"
fi

echo ""
if [[ $TOTAL_ISSUES -eq 0 ]]; then
  echo "${GREEN}${BOLD}✓ Parity OK${RESET}"
  exit 0
else
  echo "${RED}${BOLD}✗ Parity FAILED${RESET}  (drift=$DRIFTED missing-in-target=$MISSING_TARGET)"
  if [[ $FAIL_ON_DRIFT -eq 1 ]]; then
    exit 1
  else
    echo "${DIM}(--warn-only: exiting 0 despite drift)${RESET}"
    exit 0
  fi
fi
