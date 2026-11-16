#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
. "${ENV_FILE:-./.env}"
set +a

SRC_MYSQL="${SRC_MYSQL_CONTAINER:-vocab-mysql-1}"
SRC_DB="${SRC_DB:-${DB_NAME:-vocab_learn}}"
DST_MYSQL="${TARGET_MYSQL_CONTAINER:-vocab-mysql-1}"
DST_DB="${TARGET_DB:?set TARGET_DB}"
NETWORK="${NETWORK:-vocab_default}"
S3_URL="${TARGET_S3_URL:-http://s3:9000}"
TARGET_BUCKET="${TARGET_BUCKET:?set TARGET_BUCKET}"
TARGET_S3_ACCESS_KEY="${TARGET_S3_ACCESS_KEY:-$S3_ACCESS_KEY}"
TARGET_S3_SECRET_KEY="${TARGET_S3_SECRET_KEY:-$S3_SECRET_KEY}"
AWS_IMAGE="${AWS_IMAGE:-amazon/aws-cli:2.38.5}"
TABLES="nguoi_dung bo_the the_tu_vung tien_do_the lich_su_on tep_tin dang_ky_goi giao_dich_thanh_toan nhat_ky_quan_tri flyway_schema_history"

count() {
  docker exec "$1" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -N -B -e 'SELECT COUNT(*) FROM \`$2\`.\`$3\`'" 2>/dev/null
}

fail=0
for t in $TABLES; do
  a=$(count "$SRC_MYSQL" "$SRC_DB" "$t")
  b=$(count "$DST_MYSQL" "$DST_DB" "$t")
  status=OK
  [ "$a" = "$b" ] || { status=DIFF; fail=1; }
  printf '%-24s src=%-8s dst=%-8s %s\n' "$t" "$a" "$b" "$status"
done

keys=$(docker exec "$DST_MYSQL" sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -N -B -e \"SELECT object_key FROM \\\`$DST_DB\\\`.tep_tin WHERE trang_thai_xoa = 'CON_HIEU_LUC'\"" 2>/dev/null | sort)
objects=$(MSYS_NO_PATHCONV=1 docker run --rm --network "$NETWORK" \
  -e AWS_ACCESS_KEY_ID="$TARGET_S3_ACCESS_KEY" -e AWS_SECRET_ACCESS_KEY="$TARGET_S3_SECRET_KEY" -e AWS_DEFAULT_REGION=us-east-1 \
  "$AWS_IMAGE" --endpoint-url "$S3_URL" s3 ls "s3://$TARGET_BUCKET" --recursive | awk '{print $4}' | sort)
total=$(printf '%s\n' "$keys" | grep -c . || true)
missing=$(comm -23 <(printf '%s\n' "$keys" | grep .) <(printf '%s\n' "$objects" | grep .) | wc -l | tr -d ' ')
echo "file_references=$total missing_objects=$missing"
[ "$missing" = "0" ] || fail=1
[ "$fail" = "0" ] && echo "RESULT=PASS" || { echo "RESULT=FAIL"; exit 1; }
