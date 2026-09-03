#!/bin/bash

# Medusa Order Creation Test Script
# This script simulates a customer creating an order to test the notification system

set -e  # Exit on any error

# Configuration
MEDUSA_URL="http://localhost:9000"
PUBLISHABLE_KEY="pk_2585734d055af512ad0506e7343b91c4419bb9fe0df0f4181f89bffd9fba3d56"
ADMIN_EMAIL="roicocory@yahoo.com.br"
ADMIN_PASSWORD="Rwbento123!"
CUSTOMER_EMAIL="test03@email.com"
CUSTOMER_PASSWORD="Rwbento123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Function to extract JSON values
extract_json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d':' -f2 | tr -d '"' | tr -d ' '
}

# Function to make API calls with error handling
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local extra_headers=$4

    # Determine headers based on endpoint type
    if [[ "$endpoint" == "/store/"* ]]; then
        # Store API calls need publishable key
        if [ -n "$extra_headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
                -H "$extra_headers" \
                -d "$data" \
                "$MEDUSA_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "x-publishable-api-key: $PUBLISHABLE_KEY" \
                -d "$data" \
                "$MEDUSA_URL$endpoint")
        fi
    else
        # Admin API calls
        if [ -n "$extra_headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "$extra_headers" \
                -d "$data" \
                "$MEDUSA_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$MEDUSA_URL$endpoint")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo "$body"
    else
        print_error "API call failed with status $http_code"
        echo "$body"
        exit 1
    fi
}

echo "🛒 Medusa Order Creation Test Script"
echo "===================================="
echo ""

# Step 1: Admin Login (to verify system is working)
print_step "1. Admin Login Verification"
admin_login_data='{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
}'

admin_response=$(api_call "POST" "/auth/user/emailpass" "$admin_login_data")
admin_token=$(extract_json_value "$admin_response" "token")

if [ -n "$admin_token" ]; then
    print_success "Admin login successful"
    print_info "Admin token: ${admin_token:0:20}..."
else
    print_error "Admin login failed"
    exit 1
fi

# Step 2: Get Store Information
print_step "2. Getting Store Information"
store_response=$(api_call "GET" "/store" "")
print_success "Store information retrieved"

# Step 3: Get Available Products
print_step "3. Getting Available Products"
products_response=$(api_call "GET" "/store/products?limit=5" "")
product_id=$(echo "$products_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$product_id" ]; then
    print_success "Found product: $product_id"
else
    print_error "No products found. Please ensure your Medusa store has products."
    exit 1
fi

# Get product details to find variant
product_detail_response=$(api_call "GET" "/store/products/$product_id" "")
variant_id=$(echo "$product_detail_response" | grep -o '"id":"[^"]*"' | grep -v "$product_id" | head -1 | cut -d'"' -f4)

if [ -n "$variant_id" ]; then
    print_success "Found variant: $variant_id"
else
    print_error "No product variants found"
    exit 1
fi

# Step 4: Create Cart
print_step "4. Creating Shopping Cart"
cart_data='{
    "region_id": null
}'

cart_response=$(api_call "POST" "/store/carts" "$cart_data")
cart_id=$(extract_json_value "$cart_response" "id")

if [ -n "$cart_id" ]; then
    print_success "Cart created: $cart_id"
else
    print_error "Failed to create cart"
    exit 1
fi

# Step 5: Add Item to Cart
print_step "5. Adding Item to Cart"
add_item_data='{
    "variant_id": "'$variant_id'",
    "quantity": 1
}'

add_item_response=$(api_call "POST" "/store/carts/$cart_id/line-items" "$add_item_data")
print_success "Item added to cart"

# Step 6: Get Available Regions
print_step "6. Getting Available Regions"
regions_response=$(api_call "GET" "/store/regions" "")
region_id=$(echo "$regions_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$region_id" ]; then
    print_success "Found region: $region_id"
else
    print_error "No regions found"
    exit 1
fi

# Step 7: Update Cart with Region
print_step "7. Updating Cart with Region"
update_cart_data='{
    "region_id": "'$region_id'"
}'

update_cart_response=$(api_call "POST" "/store/carts/$cart_id" "$update_cart_data")
print_success "Cart updated with region"

# Step 8: Add Shipping Address
print_step "8. Adding Shipping Address"
shipping_address_data='{
    "shipping_address": {
        "first_name": "Test",
        "last_name": "Customer",
        "address_1": "123 Test Street",
        "city": "Test City",
        "country_code": "US",
        "postal_code": "12345",
        "phone": "+1234567890"
    }
}'

shipping_response=$(api_call "POST" "/store/carts/$cart_id" "$shipping_address_data")
print_success "Shipping address added"

# Step 9: Get Shipping Options
print_step "9. Getting Shipping Options"
shipping_options_response=$(api_call "GET" "/store/shipping-options/$cart_id" "")
shipping_option_id=$(echo "$shipping_options_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$shipping_option_id" ]; then
    print_success "Found shipping option: $shipping_option_id"
else
    print_info "No shipping options found, proceeding without shipping"
fi

# Step 10: Add Shipping Method (if available)
if [ -n "$shipping_option_id" ]; then
    print_step "10. Adding Shipping Method"
    shipping_method_data='{
        "option_id": "'$shipping_option_id'"
    }'

    shipping_method_response=$(api_call "POST" "/store/carts/$cart_id/shipping-methods" "$shipping_method_data")
    print_success "Shipping method added"
else
    print_step "10. Skipping Shipping Method (none available)"
fi

# Step 11: Add Payment Session
print_step "11. Creating Payment Session"
payment_session_data='{
    "provider_id": "manual"
}'

payment_response=$(api_call "POST" "/store/carts/$cart_id/payment-sessions" "$payment_session_data")
print_success "Payment session created"

# Step 12: Select Payment Session
print_step "12. Selecting Payment Session"
select_payment_data='{
    "provider_id": "manual"
}'

select_payment_response=$(api_call "POST" "/store/carts/$cart_id/payment-session" "$select_payment_data")
print_success "Payment session selected"

# Step 13: Add Customer Information
print_step "13. Adding Customer Information"
customer_data='{
    "email": "'$CUSTOMER_EMAIL'"
}'

customer_response=$(api_call "POST" "/store/carts/$cart_id" "$customer_data")
print_success "Customer information added"

# Step 14: Complete Cart (Create Order)
print_step "14. Completing Order"
complete_response=$(api_call "POST" "/store/carts/$cart_id/complete" "{}")

# Extract order information
order_id=$(extract_json_value "$complete_response" "id")
display_id=$(extract_json_value "$complete_response" "display_id")

if [ -n "$order_id" ]; then
    print_success "🎉 ORDER CREATED SUCCESSFULLY!"
    echo ""
    echo "📋 Order Details:"
    echo "   Order ID: $order_id"
    echo "   Display ID: #$display_id"
    echo "   Customer: $CUSTOMER_EMAIL"
    echo "   Product: $product_id"
    echo "   Variant: $variant_id"
    echo ""
    print_info "Check your Angular app notification system!"
    print_info "The order should appear in the notification bell within 30 seconds."
    echo ""

    # Optional: Show order in admin
    print_step "15. Verifying Order in Admin API"
    admin_order_response=$(api_call "GET" "/admin/orders/$order_id" "" "Authorization: Bearer $admin_token")
    admin_display_id=$(extract_json_value "$admin_order_response" "display_id")

    if [ -n "$admin_display_id" ]; then
        print_success "Order verified in admin: #$admin_display_id"
    fi

else
    print_error "Failed to create order"
    echo "$complete_response"
    exit 1
fi

echo ""
echo "✅ Test completed successfully!"
echo "🔔 Your notification system should now show the new order."
echo ""
