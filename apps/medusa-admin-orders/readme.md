# Medusa Admin Orders

## Overview

A specialized Ionic Angular mobile application for order management and fulfillment in the Medusa e-commerce platform. This admin-focused app provides store staff with tools to manage orders, track shipments, handle fulfillments, and monitor the order lifecycle in real-time.

## Project Information

- **Type:** Ionic Angular 8 (Standalone Components)
- **Angular Version:** 20.0.0
- **Ionic Version:** 8.0.0
- **State Management:** NGXS 20.1.0
- **Capacitor:** 7.4.4 (Mobile Native Support)
- **Architecture:** Standalone components with lazy-loaded routes

## Purpose

This application is designed to be a dedicated mobile interface for store administrators and staff to:

- View and manage orders efficiently on mobile devices
- Handle order fulfillment workflows (pack, ship, deliver)
- Track shipments and delivery status
- Receive real-time order notifications via WebSocket/SSE
- Access order details and history on-the-go
- Monitor dashboard metrics and order statistics

## Key Features

### ✅ Implemented

1. **Authentication System**
   - Admin authentication via Medusa Admin API
   - Token-based authentication with NGXS state persistence
   - Route guards for protected pages
   - Auto-login via stored tokens

2. **Order Management**
   - Order listing with pagination
   - Order detail view with full order information
   - Order fulfillment workflows
   - Order status tracking and timeline
   - Multiple fulfillment support

3. **Real-time Notifications**
   - WebSocket integration (Socket.IO)
   - Server-Sent Events (SSE) for order updates
   - Push notifications for order changes
   - Notification badge/icon component

4. **Dashboard**
   - Order statistics and metrics
   - Recent orders overview
   - Quick actions for common tasks

5. **Order Timeline**
   - Visual timeline of order changes
   - Order status transitions
   - Activity tracking

### 🚧 Planned/In Progress

1. **Delivery Tracking** (See `.context/DELIVERY_TRACKING_PLAN.md`)
   - Automatic shipment tracking integration
   - Carrier API integration (UPS, FedEx, DHL, USPS)
   - Real-time delivery status updates
   - Automatic "Mark as Delivered" when carrier confirms
   - Tracking event timeline

2. **Enhanced Order Detail**
   - Redesigned order detail UI
   - Improved shipment modal with carrier selection
   - Tracking number input and management

3. **Advanced Features**
   - Delivery photo support
   - Delivery exception handling
   - Analytics and reporting
   - Multi-language support (i18n infrastructure ready)

## Project Structure

```
apps/medusa-admin-orders/
├── src/
│   ├── app/
│   │   ├── components/          # Reusable components
│   │   │   ├── dashboard/       # Dashboard component
│   │   │   ├── notification-icon/  # Notification badge
│   │   │   ├── order-changes-timeline/  # Order timeline visualization
│   │   │   └── orders-pagination/  # Pagination component
│   │   ├── pages/               # Page components (lazy-loaded)
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── login/           # Login page
│   │   │   ├── orders/          # Orders list
│   │   │   ├── order-detail/    # Detailed order view (complex component)
│   │   │   └── register/        # Registration page
│   │   ├── services/            # Business logic services
│   │   │   ├── notification.service.ts
│   │   │   └── websocket-notification.service.ts
│   │   ├── shared/              # Shared utilities and types
│   │   │   ├── admin-interfaces/  # TypeScript interfaces
│   │   │   ├── api/             # API service layer
│   │   │   ├── icons/           # Custom icons
│   │   │   ├── interceptor/     # HTTP interceptors
│   │   │   ├── language/        # i18n support
│   │   │   └── native/          # Capacitor native features
│   │   └── store/               # NGXS state management
│   │       ├── auth/            # Authentication state
│   │       ├── dashboard/       # Dashboard state
│   │       ├── keyboard/        # Keyboard state
│   │       ├── language/        # Language state
│   │       └── orders/          # Orders state
│   ├── assets/
│   │   ├── i18n/                # Translation files
│   │   └── ...
│   └── environments/            # Environment configuration
├── .context/                    # Project documentation and planning
│   ├── DELIVERY_TRACKING_PLAN.md  # Delivery tracking implementation plan
│   ├── ADMIN_API_QUICK_REFERENCE.md
│   ├── ORDER_DETAIL_ENHANCEMENTS.md
│   └── ... (many planning docs)
└── package.json
```

## Technology Stack

### Core Frameworks
- **Angular 20** - Latest Angular with standalone components
- **Ionic 8** - Mobile-first UI framework
- **TypeScript 5.8** - Type-safe development

### State Management
- **NGXS 20** - Reactive state management
  - Auth state
  - Orders state
  - Dashboard state
  - Language state
  - Keyboard state

### Real-time Communication
- **Socket.IO Client 4.8** - WebSocket connections
- **SSE (Server-Sent Events)** - Alternative real-time updates

### Mobile Features
- **Capacitor 7** - Native mobile capabilities
  - App lifecycle management
  - Haptics feedback
  - Keyboard handling
  - Status bar control

### Internationalization
- **@ngx-translate 17** - Multi-language support
- Translation files in `src/assets/i18n/`

## Configuration

### Environment Variables

Located in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  MEDUSA_ADMIN_KEY: "sk_...",  // Admin API key
  MEDUSA_API_BASE_PATH: "http://localhost:9000",
  MEDUSA_BACKEND_URL: "http://localhost:9000",
  MEDUSA_SSE_URL: "http://localhost:9000/events",
  MEDUSA_WS_URL: "http://localhost:9000",  // Socket.IO
  MEDUSA_PUBLISHABLE_KEY: "pk_..."  // Publishable API key
};
```

### Default Credentials

**⚠️ Development Only - Change in Production**

```
Email: roicoroy@yahoo.com.br
Password: Rwbento123!
```

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Ionic CLI (optional)
- Capacitor CLI (for mobile builds)

### Installation

```bash
# Install dependencies (from workspace root)
yarn install

# Or install in the app directory
cd apps/medusa-admin-orders
npm install
```

### Development

**Using Nx (Recommended - from workspace root):**
```bash
# Start development server (port 8101)
yarn admin-orders:dev
# or
nx serve medusa-admin-orders

# Build
yarn admin-orders:build
# or
nx build medusa-admin-orders

# Test
yarn admin-orders:test
# or
nx test medusa-admin-orders

# Lint
yarn admin-orders:lint
# or
nx lint medusa-admin-orders
```

**Using Ionic CLI directly (from app directory):**
```bash
cd apps/medusa-admin-orders

# Start development server
npm start
# or
ionic serve --port 8101

# Build
npm run build

# Production build
npm run build --configuration production
```

### Mobile Development

**Using Nx (Recommended):**
```bash
# Sync Capacitor
yarn admin-orders:cap:sync
# or
nx run medusa-admin-orders:cap:sync

# Open iOS
yarn admin-orders:cap:ios
# or
nx run medusa-admin-orders:cap:open:ios

# Open Android
yarn admin-orders:cap:android
# or
nx run medusa-admin-orders:cap:open:android
```

**Using Capacitor CLI directly:**
```bash
cd apps/medusa-admin-orders

# Sync Capacitor
npx cap sync

# Open iOS
npx cap open ios

# Open Android
npx cap open android
```

## Architecture Highlights

### Standalone Components
All components are standalone (no NgModules), using Angular's modern architecture.

### Lazy Loading
Routes are lazy-loaded for optimal performance:

```typescript
{
  path: 'orders/:id',
  loadComponent: () => import('./pages/order-detail/order-detail.page')
    .then(m => m.OrderDetailPage),
  canActivate: [authGuard]
}
```

### State Management Pattern
NGXS stores handle:
- Authentication state (persisted via storage plugin)
- Orders data with caching
- Dashboard metrics
- Real-time notification state

### Service Layer
- **API Services** - Medusa API integration
- **Notification Services** - Real-time updates via WebSocket/SSE
- **Interceptors** - HTTP request/response handling

## Key Components

### Order Detail Page (`order-detail`)
Complex component with:
- Order information display
- Fulfillment management
- Shipment tracking
- Order timeline
- Action buttons (pack, ship, deliver)

### Dashboard Component
- Order statistics
- Quick metrics
- Recent orders list

### Notification Icon Component
- Real-time badge updates
- Notification count display
- Visual indicator for new notifications

### Order Changes Timeline
- Visual representation of order history
- Status transitions
- Timestamp tracking

## Planning Documents

The `.context/` directory contains extensive planning documentation:

- **DELIVERY_TRACKING_PLAN.md** - Comprehensive plan for shipment tracking
- **ORDER_DETAIL_ENHANCEMENTS.md** - UI/UX improvements for order detail
- **ADMIN_API_QUICK_REFERENCE.md** - API endpoint reference
- **REAL_TIME_NOTIFICATIONS_SETUP.md** - WebSocket/SSE implementation guide
- Many other planning and migration documents

## Current Status

### ✅ Stable Features
- Authentication and authorization
- Order listing and pagination
- Order detail view
- Basic fulfillment workflows
- Real-time notifications
- Dashboard metrics

### 🚧 In Development
- Enhanced delivery tracking
- Improved shipment modal
- Carrier integration
- Automatic delivery detection

### 📋 Planned
- Advanced analytics
- Customer communication tools
- Delivery photo support
- Multi-carrier tracking integration

## Integration with Medusa

This app integrates with Medusa.js backend:

- **Admin API** - For authenticated operations
- **Orders API** - Order management endpoints
- **Fulfillment API** - Shipment and delivery management
- **WebSocket/SSE** - Real-time order updates
- **Notifications** - Order event notifications

## Mobile Considerations

- **Responsive Design** - Optimized for mobile screens
- **Touch Interactions** - Mobile-friendly UI components
- **Offline Support** - Considered for future implementation
- **Native Features** - Haptics, status bar, keyboard handling via Capacitor

## Security Notes

⚠️ **Important:**
- Admin API keys are sensitive - never commit production keys
- Use environment variables for configuration
- Implement proper token refresh mechanisms
- Validate all API responses
- Use HTTPS in production

## Contributing

When adding features, please:
1. Follow the existing architecture patterns
2. Update relevant `.context/` documentation
3. Add TypeScript interfaces in `shared/admin-interfaces/`
4. Update NGXS state if needed
5. Add appropriate error handling
6. Consider mobile UX in design decisions

## Resources

- [Ionic Framework Docs](https://ionicframework.com/docs)
- [Angular Docs](https://angular.io/docs)
- [NGXS Docs](https://www.ngxs.io/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Medusa.js Docs](https://docs.medusajs.com)

---

## API Compatibility

✅ **FULLY COMPATIBLE** with `medusa-server` API, plugins, and webhooks infrastructure.

For detailed compatibility analysis, see **[API_COMPATIBILITY.md](./API_COMPATIBILITY.md)**

**Quick Summary:**
- ✅ All Admin API endpoints are standard Medusa v2 (fully compatible)
- ✅ Authentication uses same email/password system
- ✅ WebSocket (Socket.IO) fully supported via custom websocket module
- ✅ SSE (`/events`) endpoint available for real-time updates
- ✅ Webhooks plugin compatible (backend-only, doesn't interfere)
- ✅ All plugins are compatible and don't conflict with Admin API

**Configuration Required:**
- Set `ADMIN_CORS` in medusa-server `.env` to include Angular app origin
- Initialize WebSocket server (auto or via `/admin/websocket/init`)

---

**Created:** Based on Ionic Angular template  
**Last Updated:** API compatibility verified with medusa-server  
**Status:** Active Development - Fully Compatible  
**Maintainer:** Goiaba Platform Team
