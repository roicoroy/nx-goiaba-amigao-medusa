#!/bin/bash

# Batch Order Creation Script
# Creates multiple orders with delays to test notification system

# Configuration
MEDUSA_URL="http://localhost:9000"
PUBLISHABLE_KEY="pk_2585734d055af512ad0506e7343b91c4419bb9fe0df0f4181f89bffd9fba3d56"
ORDER_COUNT=${1:-3}  # Default to 3 orders, or use first argument
DELAY=${2:-10}       # Default to 10 seconds between orders

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 Batch Order Creation Test${NC}"
echo "============================="
echo "📊 Creating $ORDER_COUNT orders with ${DELAY}s delays"
echo ""

# Function to create a single order
create_order() {
    local order_num=$1
    local customer_email="batch-test-$order_num-$(date +%s)@example.com"

    echo -e "${YELLOW}[Order $order_num/$ORDER_COUNT]${NC} Creating order for $customer_email"

    # Get product and variant (simplified)
    PRODUCTS=$(curl -s -H "x-publishable-api-key: $PUBLISHABLE_KEY" "$MEDUSA_URL/store/products?limit=1")
    PRODUCT_ID=$(echo "$PRODUCTS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$PRODUCT_ID" ]; then
        echo "❌ No products found"
        return 1
    fi

    PRODUCT_DETAIL=$(curl -s -H "x-publishable-api-key: $PUBLISHABLE_KEY" "$MEDUSA_URL/store/products/$PRODUCT_ID")
    VARIANT_ID=$(echo "$PRODUCT_DETAIL" | grep -o '"variants":\[[^]]*\]' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    # Get region
    REGIONS=$(curl -s -H "x-publishable-api-key: $PUBLISHABLE_KEY" "$MEDUSA_URL/store/regions")
    REGION_ID=$(echo "$REGIONS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    # Create cart
    CART_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d "{\"region_id\": \"$REGION_ID\"}" \
        "$MEDUSA_URL/store/carts")
    CART_ID=$(echo "$CART_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$CART_ID" ]; then
        echo "❌ Failed to create cart"
        return 1
    fi

    # Add item
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d "{\"variant_id\": \"$VARIANT_ID\", \"quantity\": 1}" \
        "$MEDUSA_URL/store/carts/$CART_ID/line-items" > /dev/null

    # Add customer
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d "{\"email\": \"$customer_email\"}" \
        "$MEDUSA_URL/store/carts/$CART_ID" > /dev/null

    # Add address
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d '{
            "shipping_address": {
                "first_name": "Batch",
                "last_name": "Test",
                "address_1": "123 Test St",
                "city": "Test City",
                "country_code": "US",
                "postal_code": "12345"
            }
        }' \
        "$MEDUSA_URL/store/carts/$CART_ID" > /dev/null

    # Setup payment
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d '{}' \
        "$MEDUSA_URL/store/carts/$CART_ID/payment-collection" > /dev/null

    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d '{"provider_id": "manual"}' \
        "$MEDUSA_URL/store/carts/$CART_ID/payment-sessions" > /dev/null

    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d '{"provider_id": "manual"}' \
        "$MEDUSA_URL/store/carts/$CART_ID/payment-session" > /dev/null

    # Complete order
    ORDER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
        -d "{}" \
        "$MEDUSA_URL/store/carts/$CART_ID/complete")

    ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    DISPLAY_ID=$(echo "$ORDER_RESPONSE" | grep -o '"display_id":[0-9]*' | cut -d':' -f2)

    if [ -n "$ORDER_ID" ]; then
        echo -e "   ${GREEN}✅ Order #$DISPLAY_ID created successfully${NC}"
        return 0
    else
        echo "   ❌ Failed to create order"
        return 1
    fi
}

# Create orders with delays
successful_orders=0
failed_orders=0

for i in $(seq 1 $ORDER_COUNT); do
    if create_order $i; then
        ((successful_orders++))
    else
        ((failed_orders++))
    fi

    # Add delay between orders (except for the last one)
    if [ $i -lt $ORDER_COUNT ]; then
        echo "⏳ Waiting ${DELAY}s before next order..."
        sleep $DELAY
    fi
done

echo ""
echo -e "${BLUE}📊 Batch Test Results${NC}"
echo "===================="
echo -e "${GREEN}✅ Successful orders: $successful_orders${NC}"
if [ $failed_orders -gt 0 ]; then
    echo -e "${RED}❌ Failed orders: $failed_orders${NC}"
fi
echo ""
echo -e "${YELLOW}🔔 Check your Angular app notification system!${NC}"
echo "   You should see $successful_orders notifications appear over the next few minutes."
echo ""
