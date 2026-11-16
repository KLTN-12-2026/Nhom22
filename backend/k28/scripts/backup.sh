#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
. "${ENV_FILE:-./.env}"
set +a

MYSQL_CONTAINER="${MYSQL_CONTAINER:-vocab-mysql-1}"
NETWORK="${NETWORK:-vocab_default}"
S3_URL="${S3_URL:-http://s3:9000}"
AWS_IMAGE="${AWS_IMAGE:-amazon/aws-cli:2.38.5}"
OUT="${1:-backups/$(date -u +%Y%m%dT%H%M%SZ)}"

mkdir -p "$OUT/s3"
OUT="$(cd "$OUT" && pwd)"
start=$(date +%s)

docker exec "$MYSQL_CONTAINER" sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --set-gtid-purged=OFF --default-character-set=utf8mb4 "$MYSQL_DATABASE"' \
  | gzip > "$OUT/mysql.sql.gz"

MSYS_NO_PATHCONV=1 docker run --rm --network "$NETWORK" \
  -e AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" -e AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" -e AWS_DEFAULT_REGION=us-east-1 \
  -v "$OUT/s3:/backup" "$AWS_IMAGE" \
  --endpoint-url "$S3_URL" s3 sync "s3://${S3_BUCKET:-vocab-files}" /backup --only-show-errors

objects=$(find "$OUT/s3" -type f | wc -l | tr -d ' ')
(cd "$OUT" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
end=$(date +%s)

cat > "$OUT/manifest.txt" <<EOF
created_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
database=${DB_NAME:-vocab_learn}
bucket=${S3_BUCKET:-vocab-files}
mysql_dump_bytes=$(wc -c < "$OUT/mysql.sql.gz" | tr -d ' ')
s3_objects=$objects
duration_seconds=$((end - start))
EOF
cat "$OUT/manifest.txt"
echo "backup=$OUT"
