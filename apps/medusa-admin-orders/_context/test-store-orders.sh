#!/bin/bash

# Test /store/orders endpoint with staff customer token

API_URL="http://localhost:9000"
PUBLISHABLE_KEY="pk_2585734d055af512ad0506e7343b91c4419bb9fe0df0f4181f89bffd9fba3d56"

# Staff credentials
STAFF_EMAIL="test03@email.com"
STAFF_PASSWORD="Rwbento123!"

echo "=========================================="
echo "Testing /store/orders Endpoint"
echo "=========================================="
echo ""

# Step 1: Login as staff customer
echo "1️⃣  Logging in as staff customer..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/customer/emailpass" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: ${PUBLISHABLE_KEY}" \
  -d "{
    \"email\": \"${STAFF_EMAIL}\",
    \"password\": \"${STAFF_PASSWORD}\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Step 2: Verify staff status
echo "2️⃣  Verifying staff status..."
PROFILE_RESPONSE=$(curl -s -X GET "${API_URL}/store/customers/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-publishable-api-key: ${PUBLISHABLE_KEY}")

echo "Profile Response:"
echo "$PROFILE_RESPONSE" | jq '.'
echo ""

IS_STAFF=$(echo "$PROFILE_RESPONSE" | jq -r '.customer.is_store_staff // false')

if [ "$IS_STAFF" != "true" ]; then
  echo "❌ User is not staff"
  exit 1
fi

echo "✅ User is staff"
echo ""

# Step 3: Test /store/orders endpoint
echo "3️⃣  Fetching orders from /store/orders..."
ORDERS_RESPONSE=$(curl -s -X GET "${API_URL}/store/orders?limit=10&offset=0" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-publishable-api-key: ${PUBLISHABLE_KEY}")

echo "Orders Response:"
echo "$ORDERS_RESPONSE" | jq '.'
echo ""

# Check if we got orders or an error
if echo "$ORDERS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Error fetching orders"
  exit 1
fi

ORDER_COUNT=$(echo "$ORDERS_RESPONSE" | jq -r '.count // 0')
echo "✅ Successfully fetched orders. Total count: $ORDER_COUNT"
echo ""

# Step 4: Test with non-staff customer (should fail)
echo "4️⃣  Testing with non-staff customer (should fail)..."
REGULAR_EMAIL="customer@example.com"
REGULAR_PASSWORD="password123"

# Try to login as regular customer
REGULAR_LOGIN=$(curl -s -X POST "${API_URL}/auth/customer/emailpass" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: ${PUBLISHABLE_KEY}" \
  -d "{
    \"email\": \"${REGULAR_EMAIL}\",
    \"password\": \"${REGULAR_PASSWORD}\"
  }")

REGULAR_TOKEN=$(echo "$REGULAR_LOGIN" | jq -r '.token // empty')

if [ -n "$REGULAR_TOKEN" ]; then
  echo "Regular customer token received, testing /store/orders..."

  REGULAR_ORDERS=$(curl -s -X GET "${API_URL}/store/orders" \
    -H "Authorization: Bearer ${REGULAR_TOKEN}" \
    -H "x-publishable-api-key: ${PUBLISHABLE_KEY}")

  echo "Regular customer orders response:"
  echo "$REGULAR_ORDERS" | jq '.'

  if echo "$REGULAR_ORDERS" | jq -e '.message' | grep -q "Access denied"; then
    echo "✅ Correctly denied access to non-staff customer"
  else
    echo "⚠️  Non-staff customer might have access (check response)"
  fi
else


echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo "⚠️  Could not test with regular customer (no account exists)"
fi
