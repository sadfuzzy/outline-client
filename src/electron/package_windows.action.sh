#!/bin/bash -eu
#
# Copyright 2018 The Outline Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
PLATFORM=
BUILD_MODE=debug
for i in "$@"; do
    case $i in
    --platform=*)
        echo "package_windows is for the windows platform. ignoring."
        shift
        ;;
    --buildMode=*)
        BUILD_MODE="${i#*=}"
        shift
        ;;
    -* | --*)
        echo "Unknown option: ${i}"
        exit 1
        ;;
    *) ;;
    esac
done

npm run action src/electron/package_common -- \
  --platform=windows \
  --buildMode="${BUILD_MODE}"

if [[ -n ${SENTRY_DSN:-} ]]; then
  # Build the Sentry URL for the installer by parsing the API key and project ID from $SENTRY_DSN,
  # which has the following format: https://[32_CHAR_API_KEY]@sentry.io/[PROJECT_ID].
  readonly API_KEY=$(echo $SENTRY_DSN | awk -F/ '{print substr($3, 0, 32)}')
  readonly PROJECT_ID=$(echo $SENTRY_DSN | awk -F/ '{print $4}')
  readonly SENTRY_URL="https://sentry.io/api/$PROJECT_ID/store/?sentry_version=7&sentry_key=$API_KEY"
fi

# TODO: Move env.sh to build/electron/.
cat >build/env.nsh <<EOF
!define RELEASE "$(node scripts/get_version.mjs --platform=windows)"
!define SENTRY_URL "${SENTRY_URL:-}"
EOF

electron-builder \
  --win \
  --publish never \
  --config src/electron/electron-builder.json \
  --config.extraMetadata.version=$(node scripts/get_version.mjs --platform=windows)
