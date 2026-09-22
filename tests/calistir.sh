#!/usr/bin/env bash
# Halka test takimlari. Kullanim:
#   bash tests/calistir.sh          -> uygulama testleri (9 takim)
#   bash tests/calistir.sh firebase -> Firebase guvenlik kurali testleri
#
# Gereksinim: node + playwright (chromium). Playwright genel kurulumdaysa:
#   PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright bash tests/calistir.sh
set -u
cd "$(dirname "$0")/.."
export PLAYWRIGHT_PATH="${PLAYWRIGHT_PATH:-/opt/node22/lib/node_modules/playwright}"

if [ "${1:-}" = "firebase" ]; then
  cd tests/firebase
  if [ ! -d node_modules ]; then
    echo "firebase-tools kuruluyor..."
    npm install --silent firebase-tools@13 || exit 1
  fi
  echo "=== KURAL TESTLERI ==="
  ./node_modules/.bin/firebase emulators:exec --only database --project halka-d6595 \
    "node rules_test.js" 2>&1 | grep -E 'GECTI|KALDI|Sonuc'
  echo "=== ISTEMCI AKISI TESTLERI ==="
  ./node_modules/.bin/firebase emulators:exec --only database --project halka-d6595 \
    "node client_test.js" 2>&1 | grep -E 'GECTI|KALDI|Sonuc|Sayfa hatasi'
  exit 0
fi

fail=0
for t in tests/test_streak.js tests/test_round.js tests/test_xp.js \
         tests/test_charts.js tests/test_pct.js tests/test_celeb.js tests/test_save.js \
         tests/test_import.js tests/test_fbload.js; do
  printf "%-24s " "$(basename "$t")"
  out=$(node "$t" 2>&1)
  echo "$out" | grep -E 'Sonuc|Sayfa hatasi' | tr '\n' ' '
  echo "$out" | grep -q 'KALDI' && { fail=1; echo "  <-- KALAN HATA VAR"; } || echo
done
exit $fail
