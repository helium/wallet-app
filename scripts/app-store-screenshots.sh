#!/usr/bin/env bash
# Captures the App Store screenshot sets on iOS simulators: iPhone with
# Dynamic Island (medium and large), iPad 13", and iPhone Duo outer and inner.
#
#   eval "$(scripts/maestro-surfpool.sh)"     # seed the fixture wallet
#   scripts/app-store-screenshots.sh <path/to/Helium Wallet.app> [out-dir]
#
# Each set gets a new simulator with a clean status bar, light appearance and
# the en_US locale. The Maestro flows in .maestro/screenshots open each screen,
# and simctl captures it. The script checks each file against Apple's size.
# The Duo boots folded and simctl cannot unfold it, so the script stops and
# asks you to unfold it before the inner set. See .maestro/README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:?usage: scripts/app-store-screenshots.sh <path/to/app> [out-dir]}"
OUT="${2:-$ROOT/build/app-store-screenshots}"
RUNTIME="${SCREENSHOT_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-27-1}"
FLOWS="$ROOT/.maestro/screenshots"
SCREENS=(01-home 02-token 03-governance 04-activity)
TYPE_PREFIX=com.apple.CoreSimulator.SimDeviceType

: "${MAESTRO_FIXTURE_SEED:?run eval \"\$(scripts/maestro-surfpool.sh)\" first}"

log() { echo "[app-store-screenshots] $*" >&2; }

DEVICES=()
cleanup() {
  for udid in "${DEVICES[@]+"${DEVICES[@]}"}"; do
    xcrun simctl shutdown "$udid" 2>/dev/null || true
    xcrun simctl delete "$udid" 2>/dev/null || true
  done
}
trap cleanup EXIT

boot() {
  xcrun simctl boot "$1"
  xcrun simctl bootstatus "$1" -b >/dev/null
}

# Creates and boots a new simulator, imports the fixture wallet, and sets
# UDID. It runs in this shell, not a subshell, so cleanup sees the device.
prepare() {
  local type="$1" udid
  udid="$(xcrun simctl create "App Store $type" "$TYPE_PREFIX.$type" "$RUNTIME")"
  DEVICES+=("$udid")
  log "$type: booting $udid"
  boot "$udid"
  # The locale takes effect on the next boot.
  xcrun simctl spawn "$udid" defaults write -g AppleLanguages -array en-US
  xcrun simctl spawn "$udid" defaults write -g AppleLocale -string en_US
  xcrun simctl shutdown "$udid"
  boot "$udid"
  xcrun simctl ui "$udid" appearance light
  xcrun simctl status_bar "$udid" override --time 9:41 \
    --dataNetwork wifi --wifiMode active --wifiBars 3 \
    --cellularMode active --cellularBars 4 \
    --batteryState charged --batteryLevel 100
  xcrun simctl install "$udid" "$APP"
  log "$type: importing the fixture wallet"
  maestro --device "$udid" test "$ROOT/.maestro/flows/02-import-account.yaml" >&2
  UDID="$udid"
}

# Opens each screen and captures it from display $3 (empty: the main
# display). Fails when a file is not $4 x $5 pixels.
capture() {
  local udid="$1" set="$2" display="$3" width="$4" height="$5"
  local screen file size
  mkdir -p "$OUT/$set"
  for screen in "${SCREENS[@]}"; do
    maestro --device "$udid" test "$FLOWS/$screen.yaml" >&2
    file="$OUT/$set/$screen.png"
    xcrun simctl io "$udid" screenshot --type=png \
      ${display:+--display="$display"} "$file" >&2
    # Apple rejects PNGs with an alpha channel. A JPEG round trip drops it.
    if sips -g hasAlpha "$file" | grep -q 'hasAlpha: yes'; then
      sips -s format jpeg -s formatOptions best "$file" --out "$file.jpg" >/dev/null
      sips -s format png "$file.jpg" --out "$file" >/dev/null
      rm -f "$file.jpg"
    fi
    size="$(sips -g pixelWidth -g pixelHeight "$file" |
      awk '/pixelWidth/ {w = $2} /pixelHeight/ {h = $2} END {print w "x" h}')"
    if [ "$size" != "${width}x${height}" ]; then
      log "$file is $size, Apple needs ${width}x${height}"
      exit 1
    fi
    log "$set: $screen ($size)"
  done
}

# set name | device type | Apple's portrait size
SETS=(
  "iphone-dynamic-island-medium|iPhone-17|1206|2622"
  "iphone-dynamic-island-large|iPhone-17-Pro-Max|1320|2868"
  "ipad-13|iPad-Pro-13-inch-M5-12GB|2064|2752"
)

for entry in "${SETS[@]}"; do
  IFS='|' read -r set type width height <<<"$entry"
  prepare "$type"
  capture "$UDID" "$set" "" "$width" "$height"
  xcrun simctl shutdown "$UDID"
done

# The Duo shows the outer display (1) folded and the inner display (3)
# unfolded.
prepare iPhone-Duo
capture "$UDID" iphone-duo-outer 1 1398 2034
if [ ! -t 0 ]; then
  log "unfolding the iPhone Duo needs a person; run this script in a terminal"
  exit 1
fi
log "Unfold the iPhone Duo simulator ($UDID), then press Enter."
read -r
capture "$UDID" iphone-duo-inner 3 2007 2853

log "done: $OUT"
