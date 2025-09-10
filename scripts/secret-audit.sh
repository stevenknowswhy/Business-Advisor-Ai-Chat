#!/usr/bin/env bash
set -euo pipefail

# Secret Audit Script
# - Scans working tree and recent history for common secret patterns
# - Excludes placeholder values in .env.example files
# Usage:
#   scripts/secret-audit.sh [repo_dir]
# Env:
#   MAX_COMMITS: number of commits to scan in history (default: 50)
#   REPORT_PATH: where to write the report (default: $PWD/secret-audit-report.txt)

REPO_DIR="${1:-$(pwd)}"
MAX_COMMITS="${MAX_COMMITS:-50}"
REPORT="${REPORT_PATH:-$(pwd)/secret-audit-report.txt}"

cd "$REPO_DIR"

section() { echo; echo "===== $1 =====" | tee -a "$REPORT"; }

# Start report
: > "$REPORT"
START_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
section "Secret Audit Report - Start $START_TS"
echo "Repository: $REPO_DIR" | tee -a "$REPORT"
echo "Last commits scanned: $MAX_COMMITS" | tee -a "$REPORT"

# Patterns (NAME:REGEX)
PATTERNS=(
  "OPENROUTER_KEY:sk-or-v1-[A-Za-z0-9]{64}"
  "STRIPE_TEST_KEY:sk_test_[A-Za-z0-9]+"
  "POSTGRES_URL:(postgres|postgresql)://"
  "CRED_IN_URL:://[^/@:]+:[^/@]+@"
  "AWS_ACCESS_KEY:AKIA[0-9A-Z]{16}"
  "GENERIC_KEY:(^|[^A-Za-z0-9_])(api_key|apikey|secret_key)([^A-Za-z0-9_]|$)"
  "JWT_TOKEN:eyJ[A-Za-z0-9_\-]+"
  "PRIVATE_KEY:-----BEGIN[[:space:][:alnum:]]*PRIVATE KEY-----"
)

# Exclusions for grep
EXCLUDES=(
  "--exclude-dir=.git"
  "--exclude=*.lock"
  "--exclude=*.log"
  "--exclude=*.map"
  "--exclude=*.min.*"
  "--exclude=*.svg" "--exclude=*.png" "--exclude=*.jpg" "--exclude=*.jpeg" "--exclude=*.gif" "--exclude=*.webp" "--exclude=*.ico"
  "--exclude=*.pdf" "--exclude=*.zip" "--exclude=*.gz" "--exclude=*.bz2" "--exclude=*.7z"
  "--exclude=*.mp4" "--exclude=*.mp3" "--exclude=*.mov"
  "--exclude=.env.example"
)

section "Working tree scan"
for entry in "${PATTERNS[@]}"; do
  NAME="${entry%%:*}"
  REGEX="${entry#*:}"
  echo "[Pattern] $NAME" | tee -a "$REPORT"
  # shellcheck disable=SC2086
  if ! grep -RIn -E ${EXCLUDES[*]} "$REGEX" . | grep -v "/.env.example" | tee -a "$REPORT"; then
    echo "(no matches)" | tee -a "$REPORT"
  fi
  echo >> "$REPORT"
done

section "History scan (last $MAX_COMMITS commits)"
COMMITS=$(git rev-list -n "$MAX_COMMITS" HEAD 2>/dev/null || echo "")
if [ -z "$COMMITS" ]; then
  echo "No commits found (are we in a git repo?)" | tee -a "$REPORT"
else
  while IFS= read -r entry; do
    NAME="${entry%%:*}"
    REGEX="${entry#*:}"
    echo "[Pattern] $NAME" | tee -a "$REPORT"
    FOUND=0
    while IFS= read -r commit; do
      if git grep -n -E "$REGEX" "$commit" -- ":(exclude)*.env.example" 2>/dev/null | tee -a "$REPORT"; then
        FOUND=1
      fi
    done < <(echo "$COMMITS")
    if [ "$FOUND" -eq 0 ]; then
      echo "(no matches)" | tee -a "$REPORT"
    fi
    echo >> "$REPORT"
  done < <(printf '%s
' "${PATTERNS[@]}")
fi

END_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
section "Secret Audit Report - End $END_TS"
echo "Report saved to: $REPORT"

