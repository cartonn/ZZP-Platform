#!/usr/bin/env bash
# CI-only disposable runtime regression. No production credentials or integrations.
set -euo pipefail
: "${SMOKE_SHA:?Exact checkout SHA required}"
: "${SMOKE_PREFIX:?Unique resource prefix required}"
: "${SMOKE_LOG_DIR:?Evidence directory required}"
[[ "$SMOKE_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$SMOKE_PREFIX" =~ ^handslag-runtime-[0-9]+-[0-9]+$ ]]
[[ "$(git rev-parse HEAD)" == "$SMOKE_SHA" ]]
mkdir -p "$SMOKE_LOG_DIR"
printf '%s\n' "$SMOKE_SHA" > "$SMOKE_LOG_DIR/checkout-sha.txt"
image="$SMOKE_PREFIX:local"
app="$SMOKE_PREFIX-app"
strict="$SMOKE_PREFIX-strict"
db="$SMOKE_PREFIX-db"
tree="$SMOKE_PREFIX-tree"

cleanup() {
  result=$?
  trap - EXIT
  for container in "$app" "$strict" "$db" "$tree"; do
    timeout 15s docker logs "$container" > "$SMOKE_LOG_DIR/$container.log" 2>&1 || true
  done
  timeout 30s docker rm -f "$app" "$strict" "$db" "$tree" >/dev/null 2>&1 || true
  timeout 15s docker network rm "$SMOKE_PREFIX" >/dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Pull/build before isolating runtime networking. No registry login or secrets.
timeout 120s docker pull postgres:16
timeout 1200s docker build --progress=plain --label "org.opencontainers.image.revision=$SMOKE_SHA" \
  -t "$image" . 2>&1 | tee "$SMOKE_LOG_DIR/build.log"
docker image inspect --format '{{.Id}} {{index .Config.Labels "org.opencontainers.image.revision"}}' \
  "$image" > "$SMOKE_LOG_DIR/image.txt"
timeout 60s docker run --rm --name "$tree" --network none "$image" node scripts/runtime-image-check.mjs tree \
  | tee "$SMOKE_LOG_DIR/image-check.log"

# No host ports and no outbound runtime network, including for accidental adapters.
docker network create --internal "$SMOKE_PREFIX" >/dev/null
docker run -d --name "$db" --network "$SMOKE_PREFIX" --network-alias postgres \
  --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_USER=smoke -e POSTGRES_PASSWORD=synthetic-smoke -e POSTGRES_DB=smoke \
  postgres:16 >/dev/null
database_ready=false
deadline=$((SECONDS + 90))
while (( SECONDS < deadline )); do
  if timeout 5s docker exec "$db" pg_isready -h 127.0.0.1 -U smoke -d smoke >/dev/null 2>&1; then
    database_ready=true
    break
  fi
  sleep 1
done
if [[ "$database_ready" != true ]]; then echo 'Disposable PostgreSQL did not become ready'; exit 1; fi

# Only synthetic, explicit variables enter containers; no host env-file or secrets.
common=(--network "$SMOKE_PREFIX" --cap-drop ALL
  -e DATABASE_URL=postgresql://smoke:synthetic-smoke@postgres:5432/smoke
  -e AUTH_SECRET=synthetic-container-smoke-secret-at-least-32-chars
  -e AUTH_URL=http://localhost:3000
  -e SHARE_TOKEN_SECRET=synthetic-container-share-secret-at-least-32-chars
  -e TWOFA_ENC_KEY=synthetic-container-twofa-secret-at-least-32-chars
  -e DATABASE_CONNECTION_LIMIT=5 -e SEED_DEMO=false -e SEED_DEMO_RESET=false
  -e STORAGE_DRIVER=local -e EMAIL_DRIVER=noop -e BILLING_PROVIDER=noop
  -e UPLOAD_SCANNER=noop -e RATE_LIMIT_STORE=memory -e ROUTING_PROVIDER=offline
  -e DIPLOMA_VERIFIER=mock -e BIG_VERIFIER=mock -e IDENTITY_VERIFIER=mock
  -e ALLOW_MOCK_VERIFICATION=false -e PASSWORD_BREACH_CHECK=noop
  -e "COMMIT_SHA=$SMOKE_SHA" -e NEXT_TELEMETRY_DISABLED=1)

# Strict production must reject these deliberately inert integrations before DB writes.
docker run -d --name "$strict" "${common[@]}" -e DEPLOYMENT_STAGE=production "$image" >/dev/null
strict_exit=$(timeout 60s docker wait "$strict")
[[ "$strict_exit" == 1 ]]
docker logs "$strict" > "$SMOKE_LOG_DIR/strict-preflight.log" 2>&1
grep -Fq '> tsx scripts/preflight.ts --strict' "$SMOKE_LOG_DIR/strict-preflight.log"
grep -Fq 'GO MET AANDACHTSPUNTEN' "$SMOKE_LOG_DIR/strict-preflight.log"
tables=$(timeout 10s docker exec "$db" psql -U smoke -d smoke -Atc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
[[ "$tables" == 0 ]]
printf '%s\n' 'Strict entrypoint rejected inert configuration before any schema mutation.' \
  > "$SMOKE_LOG_DIR/strict-result.txt"

# Explicit demo stage permits inert adapters; SEED_DEMO=false still excludes demo users/data.
# This proves the packaged migration/seed/readiness path, not strict production success.
docker run -d --name "$app" "${common[@]}" -e DEPLOYMENT_STAGE=demo "$image" >/dev/null
runtime_ready=false
deadline=$((SECONDS + 240))
while (( SECONDS < deadline )); do
  [[ "$(docker inspect --format '{{.State.Running}}' "$app")" == true ]]
  docker logs "$app" > "$SMOKE_LOG_DIR/boot.log" 2>&1
  if timeout 10s docker exec "$app" node scripts/runtime-image-check.mjs ready \
    > "$SMOKE_LOG_DIR/readiness.log" 2>&1 \
    && grep -Fq '[start] achtergrond-seed afgerond' "$SMOKE_LOG_DIR/boot.log" \
    && [[ "$(docker inspect --format '{{.State.Health.Status}}' "$app")" == healthy ]]; then
    runtime_ready=true
    break
  fi
  sleep 2
done
if [[ "$runtime_ready" != true ]]; then echo 'Image readiness/seed/health deadline exceeded'; exit 1; fi
timeout 30s docker exec "$app" node scripts/runtime-image-check.mjs database \
  | tee "$SMOKE_LOG_DIR/database-check.log"
sleep 5
timeout 10s docker exec "$app" node scripts/runtime-image-check.mjs ready \
  | tee "$SMOKE_LOG_DIR/readiness-final.log"
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$app")" == healthy ]]
printf '%s\n' 'PASS: final Linux image, strict rejection, demo-stage PostgreSQL migrations, reference seed and readiness.' \
  'Strict production success remains outside this inert-integration smoke.' | tee "$SMOKE_LOG_DIR/result.txt"
