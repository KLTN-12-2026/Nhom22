#!/usr/bin/env bash
set -euo pipefail

BACKUP="${1:?usage: restore.sh <backup-dir>}"
BACKUP="$(cd "$BACKUP" && pwd)"
cd "$(dirname "$0")/.."
set -a
. "${ENV_FILE:-./.env}"
set +a

MYSQL_CONTAINER="${TARGET_MYSQL_CONTAINER:-vocab-mysql-1}"
TARGET_DB="${TARGET_DB:-${DB_NAME:-vocab_learn}}"
NETWORK="${NETWORK:-vocab_default}"
S3_URL="${TARGET_S3_URL:-http://s3:9000}"
TARGET_BUCKET="${TARGET_BUCKET:-${S3_BUCKET:-vocab-files}}"
TARGET_S3_ACCESS_KEY="${TARGET_S3_ACCESS_KEY:-$S3_ACCESS_KEY}"
TARGET_S3_SECRET_KEY="${TARGET_S3_SECRET_KEY:-$S3_SECRET_KEY}"
AWS_IMAGE="${AWS_IMAGE:-amazon/aws-cli:2.38.5}"

(cd "$BACKUP" && sha256sum --quiet -c SHA256SUMS)
start=$(date +%s)

docker exec "$MYSQL_CONTAINER" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -e 'CREATE DATABASE IF NOT EXISTS \`$TARGET_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci'"
gunzip -c "$BACKUP/mysql.sql.gz" | docker exec -i "$MYSQL_CONTAINER" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" --default-character-set=utf8mb4 \"$TARGET_DB\""

aws() {
  MSYS_NO_PATHCONV=1 docker run --rm --network "$NETWORK" \
    -e AWS_ACCESS_KEY_ID="$TARGET_S3_ACCESS_KEY" -e AWS_SECRET_ACCESS_KEY="$TARGET_S3_SECRET_KEY" -e AWS_DEFAULT_REGION=us-east-1 \
    -v "$BACKUP/s3:/backup:ro" "$AWS_IMAGE" --endpoint-url "$S3_URL" "$@"
}
aws s3api head-bucket --bucket "$TARGET_BUCKET" >/dev/null 2>&1 || aws s3 mb "s3://$TARGET_BUCKET"
aws s3 sync /backup "s3://$TARGET_BUCKET" --only-show-errors

end=$(date +%s)
echo "restored_db=$TARGET_DB bucket=$TARGET_BUCKET duration_seconds=$((end - start))"
