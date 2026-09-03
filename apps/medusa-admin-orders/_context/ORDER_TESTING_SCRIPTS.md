# Order Creation Testing Scripts

## Overview
Created shell scripts to test your new polling notification system by programmatically creating orders through the Medusa API.

## Scripts Created

### 1. `create-test-order.sh` - Comprehensive Order Creation
**Purpose**: Full-featured script that creates a complete order with detailed logging.

**Features**:
- ✅ Admin authentication verification
- ✅ Store and product discovery
- ✅ Complete cart workflow (create → add items → shipping → payment → checkout)
- ✅ Detailed step-by-step logging with colors
- ✅ Error handling and validation
- ✅ Order verification through admin API

**Usage**:
```bash
./create-test-order.sh
```

**What it does**:
1. Verifies admin login works
2. Discovers available products and variants
3. Creates a shopping cart
4. Adds items to cart
5. Sets up shipping address
6. Configures payment (manual provider)
7. Completes the order
8. Verifies order creation through admin API

### 2. `quick-order-test.sh` - Fast Order Creation
**Purpose**: Streamlined script for quick order creation during development.

**Features**:
- ✅ Minimal logging for speed
- ✅ Automatic product/variant discovery
- ✅ Unique customer email each run
- ✅ Essential order flow only
- ✅ Quick execution (~5-10 seconds)

**Usage**:
```bash
./quick-order-test.sh
```

**Perfect for**:
- Quick testing during development
- Verifying notification system works
- Rapid iteration testing

### 3. `batch-order-test.sh` - Multiple Order Creation
**Purpose**: Creates multiple orders with delays to test notification system under load.

**Features**:
- ✅ Configurable number of orders
- ✅ Configurable delay between orders
- ✅ Batch processing with progress tracking
- ✅ Success/failure statistics
- ✅ Stress testing capabilities

**Usage**:
```bash
# Create 3 orders with 10-second delays (default)
./batch-order-test.sh

# Create 5 orders with 15-second delays
./batch-order-test.sh 5 15

# Create 10 orders with 5-second delays
./batch-order-test.sh 10 5
```

## Configuration

### Environment Variables
All scripts use these default configurations:

```bash
MEDUSA_URL="http://localhost:9000"
ADMIN_EMAIL="admin@medusa-test.com"
ADMIN_PASSWORD="supersecret"
```

### Customization
You can modify the scripts to change:
- **API URL**: Change `MEDUSA_URL` variable
- **Admin credentials**: Update `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- **Customer details**: Modify shipping address, customer info
- **Product selection**: Change product discovery logic

## Prerequisites

### 1. Medusa Backend Running
Ensure your Medusa backend is running on `http://localhost:9000`

### 2. Store Setup Required
Your Medusa store must have:
- ✅ **At least one product** with variants
- ✅ **At least one region** configured
- ✅ **Manual payment provider** enabled (default in Medusa)
- ✅ **Admin user** with credentials matching the script

### 3. System Requirements
- `curl` command available
- `bash` shell
- `grep` and basic Unix utilities

## Testing Your Notification System

### Step-by-Step Testing Process:

1. **Start your Angular app**:
   ```bash
   ionic serve
   ```

2. **Login to the admin panel** to start polling

3. **Run a quick test**:
   ```bash
   ./quick-order-test.sh
   ```

4. **Watch for notifications**:
   - Check the notification bell icon in your Angular app
   - Should see notification within 30 seconds (polling interval)
   - Check browser console for polling logs

5. **Test multiple orders**:
   ```bash
   ./batch-order-test.sh 3 20
   ```

### Expected Results:

#### Console Logs (Angular):
```
🔄 Starting order polling every 30 seconds
🔍 Checking for new orders since 2024-11-04T18:00:00.000Z
🆕 Found 1 new orders: [...]
📢 New notification added: {...}
```

#### UI Changes:
- 🔔 Notification bell shows unread count badge
- 🍞 Toast notification appears
- 🖥️ Browser notification (if permissions granted)
- 📋 Order appears in notification popover

## Troubleshooting

### Common Issues:

#### 1. "No products found"
**Solution**: Add products to your Medusa store
```bash
# Check if products exist
curl http://localhost:9000/store/products
```

#### 2. "No regions found"
**Solution**: Configure regions in Medusa admin
```bash
# Check regions
curl http://localhost:9000/store/regions
```

#### 3. "Admin login failed"
**Solution**: Update credentials in script or create admin user

#### 4. "Cart creation failed"
**Solution**: Check Medusa backend logs, ensure store is properly configured

### Debug Mode:
Add `-x` to any script for detailed execution logging:
```bash
bash -x ./quick-order-test.sh
```

## API Endpoints Used

### Store API (Customer-facing):
- `GET /store/products` - Get available products
- `GET /store/regions` - Get available regions
- `POST /store/carts` - Create shopping cart
- `POST /store/carts/{id}/line-items` - Add items to cart
- `POST /store/carts/{id}` - Update cart (customer, address)
- `GET /store/shipping-options/{cart_id}` - Get shipping options
- `POST /store/carts/{id}/shipping-methods` - Add shipping method
- `POST /store/carts/{id}/payment-sessions` - Create payment session
- `POST /store/carts/{id}/payment-session` - Select payment method
- `POST /store/carts/{id}/complete` - Complete order (checkout)

### Admin API (Verification):
- `POST /auth/user/emailpass` - Admin login
- `GET /admin/orders/{id}` - Verify order creation

## Integration with Notification System

### How It Works:
1. **Script creates order** → Medusa database updated
2. **Angular polling service** → Checks for new orders every 30s
3. **API query**: `GET /admin/orders?created_at.gte=lastCheckTime`
4. **New order detected** → Notification system triggered
5. **UI updates** → Bell badge, toast, browser notification

### Perfect for Testing:
- ✅ **Polling intervals** - Create orders and wait for detection
- ✅ **Multiple notifications** - Batch script tests notification queue
- ✅ **Error handling** - Test with invalid data
- ✅ **Performance** - Stress test with many orders

## Example Output

### Quick Order Test:
```
🚀 Quick Order Creation Test
==============================
📦 Getting products...
✅ Found product: prod_01ABC123
✅ Found variant: variant_01DEF456
✅ Found region: reg_01GHI789
🛒 Creating cart...
✅ Cart created: cart_01JKL012
➕ Adding item to cart...
👤 Adding customer info...
📍 Adding shipping address...
🚚 Adding shipping method...
💳 Setting up payment...
🎯 Completing order...

🎉 ORDER CREATED SUCCESSFULLY!
================================
📋 Order ID: order_01MNO345
🏷️  Display ID: #1001
📧 Customer: test-1699123456@example.com
📦 Product: prod_01ABC123

🔔 Check your Angular app for the notification!
   The order should appear within 30 seconds.
```

These scripts provide a complete testing suite for your notification system, allowing you to verify that orders are properly detected and notifications are displayed in your Angular application!
