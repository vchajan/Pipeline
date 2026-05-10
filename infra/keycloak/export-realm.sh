#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
REMOTE_FILE=/tmp/pipeline-monitor-realm.json
LOCAL_FILE=$SCRIPT_DIR/pipeline-monitor-realm.json

cd "$REPO_ROOT"

docker compose -f docker-compose.yml -f docker-compose.keycloak.yml exec -T keycloak \
  /opt/keycloak/bin/kc.sh export \
  --realm pipeline-monitor \
  --file "$REMOTE_FILE" \
  --users realm_file

docker compose -f docker-compose.yml -f docker-compose.keycloak.yml cp \
  "keycloak:$REMOTE_FILE" "$LOCAL_FILE"

printf 'Exported pipeline-monitor realm to %s\n' "$LOCAL_FILE"
