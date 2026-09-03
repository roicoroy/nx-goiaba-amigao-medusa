#!/bin/bash

# Quick Order Creation Script for Testing Notifications
# This is a simplified version that focuses on creating orders quickly

set -e

# Configuration
MEDUSA_URL="http://localhost:9000"
PUBLISHABLE_KEY="pk_2585734d055af512ad0506e7343b91c4419bb9fe0df0f4181f89bffd9fba3d56"
CUSTOMER_EMAIL="test-$(date +%s)@example.com"  # Unique email each time

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Order Creation Test${NC}"
echo "=============================="

# Function to make API calls
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [[ "$endpoint" == "/store/"* ]]; then
        # Store API calls need publishable key
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
            -d "$data" \
            "$MEDUSA_URL$endpoint"
    else
        # Admin API calls
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$MEDUSA_URL$endpoint"
    fi
}

# 1. Get first available product
echo "📦 Getting products..."
PRODUCTS=$(call_api "GET" "/store/products" "")
PRODUCT_ID=$(echo "$PRODUCTS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}❌ No products found. Please add products to your Medusa store.${NC}"
    exit 1
fi

echo "✅ Found product: $PRODUCT_ID"

# 2. Get product variant
PRODUCT_DETAIL=$(call_api "GET" "/store/products/$PRODUCT_ID" "")
VARIANT_ID=$(echo "$PRODUCT_DETAIL" | grep -o '"variants":\[[^]]*\]' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$VARIANT_ID" ]; then
    echo -e "${RED}❌ No product variants found.${NC}"
    exit 1
fi

echo "✅ Found variant: $VARIANT_ID"

# 3. Get region
REGIONS=$(call_api "GET" "/store/regions" "")
REGION_ID=$(echo "$REGIONS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$REGION_ID" ]; then
    echo -e "${RED}❌ No regions found.${NC}"
    exit 1
fi

echo "✅ Found region: $REGION_ID"

# 4. Create cart
echo "🛒 Creating cart..."
CART_DATA="{\"region_id\": \"$REGION_ID\"}"
CART_RESPONSE=$(call_api "POST" "/store/carts" "$CART_DATA")
CART_ID=$(echo "$CART_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CART_ID" ]; then
    echo -e "${RED}❌ Failed to create cart.${NC}"
    echo "$CART_RESPONSE"
    exit 1
fi

echo "✅ Cart created: $CART_ID"

# 5. Add item to cart
echo "➕ Adding item to cart..."
ADD_ITEM_DATA="{\"variant_id\": \"$VARIANT_ID\", \"quantity\": 1}"
call_api "POST" "/store/carts/$CART_ID/line-items" "$ADD_ITEM_DATA" > /dev/null

# 6. Add customer email
echo "👤 Adding customer info..."
CUSTOMER_DATA="{\"email\": \"$CUSTOMER_EMAIL\"}"
call_api "POST" "/store/carts/$CART_ID" "$CUSTOMER_DATA" > /dev/null

# 7. Add shipping address
echo "📍 Adding shipping address..."
ADDRESS_DATA='{
    "shipping_address": {
        "first_name": "Test",
        "last_name": "Customer",
        "address_1": "123 Test St",
        "city": "Test City",
        "country_code": "US",
        "postal_code": "12345"
    }
}'
call_api "POST" "/store/carts/$CART_ID" "$ADDRESS_DATA" > /dev/null

# 8. Try to add shipping method (optional)
SHIPPING_OPTIONS=$(call_api "GET" "/store/shipping-options/$CART_ID" "")
SHIPPING_OPTION_ID=$(echo "$SHIPPING_OPTIONS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SHIPPING_OPTION_ID" ]; then
    echo "🚚 Adding shipping method..."
    SHIPPING_DATA="{\"option_id\": \"$SHIPPING_OPTION_ID\"}"
    call_api "POST" "/store/carts/$CART_ID/shipping-methods" "$SHIPPING_DATA" > /dev/null
fi

# 9. Create payment collection
echo "💳 Setting up payment..."
PAYMENT_COLLECTION_DATA='{}'
call_api "POST" "/store/carts/$CART_ID/payment-collection" "$PAYMENT_COLLECTION_DATA" > /dev/null

# 10. Create payment session
PAYMENT_DATA='{"provider_id": "manual"}'
call_api "POST" "/store/carts/$CART_ID/payment-sessions" "$PAYMENT_DATA" > /dev/null

# 11. Select payment session
call_api "POST" "/store/carts/$CART_ID/payment-session" "$PAYMENT_DATA" > /dev/null

# 12. Complete order
echo "🎯 Completing order..."
ORDER_RESPONSE=$(call_api "POST" "/store/carts/$CART_ID/complete" "{}")
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
DISPLAY_ID=$(echo "$ORDER_RESPONSE" | grep -o '"display_id":[0-9]*' | cut -d':' -f2)

if [ -n "$ORDER_ID" ]; then
    echo ""
    echo -e "${GREEN}🎉 ORDER CREATED SUCCESSFULLY!${NC}"
    echo "================================"
    echo "📋 Order ID: $ORDER_ID"
    echo "🏷️  Display ID: #$DISPLAY_ID"
    echo "📧 Customer: $CUSTOMER_EMAIL"
    echo "📦 Product: $PRODUCT_ID"
    echo ""
    echo -e "${BLUE}🔔 Check your Angular app for the notification!${NC}"
    echo "   The order should appear within 30 seconds."
    echo ""
else
    echo -e "${RED}❌ Failed to create order${NC}"
    echo "$ORDER_RESPONSE"
    exit 1
fi
