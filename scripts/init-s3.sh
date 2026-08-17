#!/bin/sh
set -e

BUCKET="${AWS_S3_BUCKET_NAME:-local-bucket}"

awslocal s3 mb "s3://${BUCKET}"

awslocal s3api put-bucket-cors --bucket "${BUCKET}" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
