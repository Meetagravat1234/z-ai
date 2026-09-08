#!/usr/bin/env bash
# Auto-push file watcher — commits and pushes to GitHub every 30 seconds
# whenever files in the project change.
#
# Runs in the background. Logs to /home/z/my-project/.autopush.log
# To stop: pkill -f autopush-watcher.sh
#
# To start manually: bash /home/z/my-project/scripts/autopush-watcher.sh &

set -euo pipefail
cd /home/z/my-project

LOG=/home/z/my-project/.autopush.log
INTERVAL=30  # seconds between checks

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-push watcher started (interval=${INTERVAL}s)" >> "$LOG"

# Track the last commit hash to detect when there's nothing new
LAST_HASH=$(git rev-parse HEAD 2>/dev/null || echo "none")

while true; do
  sleep "$INTERVAL"

  # Check if there are any changes (staged, unstaged, or untracked)
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    # Add all changes
    git add -A 2>/dev/null || true

    # Generate a meaningful commit message based on what changed
    CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null | head -5 | tr '\n' ' ')
    COUNT=$(git diff --cached --name-only 2>/dev/null | wc -l)

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    MSG="auto: update ${COUNT} file(s) at ${TIMESTAMP}

Changed: ${CHANGED_FILES}"

    # Commit
    if git commit -m "$MSG" --quiet 2>/dev/null; then
      # Push
      if git push origin main --quiet 2>>"$LOG"; then
        NEW_HASH=$(git rev-parse HEAD 2>/dev/null || echo "?")
        echo "[$TIMESTAMP] Pushed ${COUNT} file(s) — commit ${NEW_HASH:0:7}" >> "$LOG"
        LAST_HASH="$NEW_HASH"
      else
        echo "[$TIMESTAMP] ERROR: push failed (see above)" >> "$LOG"
      fi
    fi
  fi
done
