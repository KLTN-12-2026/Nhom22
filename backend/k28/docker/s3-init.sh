set -e
endpoint=http://s3:9000
aws --endpoint-url "$endpoint" s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null || aws --endpoint-url "$endpoint" s3 mb "s3://$S3_BUCKET"
origins=$(printf '%s' "$S3_CORS_ORIGINS" | tr -d ' ' | sed 's/[^,][^,]*/"&"/g')
printf '{"CORSRules":[{"AllowedOrigins":[%s],"AllowedMethods":["GET","PUT","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":600}]}' "$origins" > /tmp/s3-cors.json
aws --endpoint-url "$endpoint" s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration file:///tmp/s3-cors.json
