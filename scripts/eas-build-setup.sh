#!/bin/bash
set -euo pipefail

# EAS Build file secrets are stored in temp files.
# The env var contains the PATH to the temp file, not the contents.
# This script copies them to where the build expects them.

if [ -n "${DOT_ENV:-}" ]; then
  echo "Copying .env file secret into place..."
  cp "$DOT_ENV" ./.env
elif [ -f .env.sample ]; then
  echo "Generating .env from .env.sample keys and environment variables..."
  : > .env
  while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" == \#* ]] && continue
    var="${line%%=*}"
    if [ -n "${!var:-}" ]; then
      echo "${var}=${!var}" >> .env
    fi
  done < .env.sample
fi

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "Copying google-services.json into place..."
  cp "$GOOGLE_SERVICES_JSON" ./android/app/google-services.json
fi

if [ -n "${GOOGLE_SERVICE_INFO_PLIST:-}" ]; then
  echo "Copying GoogleService-Info.plist into place..."
  cp "$GOOGLE_SERVICE_INFO_PLIST" ./ios/GoogleService-Info.plist
fi
