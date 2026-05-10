#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

cd "$REPO_ROOT"

if [ "$#" -eq 0 ]; then
  set -- up --build
fi

docker compose -f docker-compose.yml -f docker-compose.keycloak.yml "$@"
