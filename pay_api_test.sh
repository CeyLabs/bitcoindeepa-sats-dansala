#!/bin/bash

# Configuration
API_URL="https://bitcoindeepa.com"
HMAC_SECRET="239994737ea4cdef263175a9ab6338a1a345b0b496202b5926bc875d770c6f4f"
ENDPOINT="/api/v1/send"
i
# Payment data
PAYLOAD='{"amount":50,"memo":"asd","to": "196536622"}'

# Generate timestamp
TIMESTAMP=$(date +%s)

# Create message to sign: METHOD + PATH + TIMESTAMP + BODY
MESSAGE="POST${ENDPOINT}${TIMESTAMP}${PAYLOAD}"

# Generate HMAC signature
SIGNATURE=$(echo -n "${MESSAGE}" | openssl dgst -sha256 -hmac "${HMAC_SECRET}" -hex | cut -d' ' -f2)

# Make the request
curl -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-HMAC-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${PAYLOAD}" \
  -v
