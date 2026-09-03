# Delivery Tracking Implementation Plan

## Overview
Add a delivery tracking step between "Mark as Shipped" and "Mark as Delivered" to provide better visibility into the order fulfillment process.

## Current Flow
1. ✅ Capture Payment
2. ✅ Pack Items (Create Fulfillment)
3. ✅ Mark as Shipped (creates shipment with tracking)
4. ✅ Mark as Delivered (manual confirmation)
5. ✅ Complete Order

## Proposed Enhanced Flow
1. ✅ Capture Payment
2. ✅ Pack Items (Create Fulfillment)
3. ✅ Mark as Shipped (creates shipment with tracking number)
4. **🆕 Track Delivery** (automatic updates from carrier)
5. ✅ Mark as Delivered (automatic or manual)
6. ✅ Complete Order

---

## Implementation Tasks

### Phase 1: UI Enhancements (Day 1 - Morning)

#### 1.1 Shipment Modal Improvements
**File:** `src/app/pages/order-detail/modal/shipment-modal.component.ts` (CREATE)

**Features:**
- Input for tracking number
- Dropdown for carrier selection (UPS, FedEx, DHL, USPS, etc.)
- Optional: Estimated delivery date picker
- Optional: Delivery notes field

**Carriers to support:**
```typescript
const CARRIERS = [
  { id: 'ups', name: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { id: 'fedex', name: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?tracknumbers=' },
  { id: 'dhl', name: 'DHL', trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
  { id: 'usps', name: 'USPS', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' },
  { id: 'manual', name: 'Manual/Other', trackingUrl: null }
];
```

#### 1.2 Order Detail Page - Shipment Display
**File:** `src/app/pages/order-detail/order-detail.page.html`

**Add shipment tracking section:**
- Display tracking number with clickable link to carrier site
- Show carrier logo/name
- Display shipment status (in transit, out for delivery, delivered)
- Show estimated delivery date
- Timeline of tracking events (if available)

**Example UI:**
```
┌─────────────────────────────────────────┐
│ Shipment #1                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Carrier: UPS                            │
│ Tracking: 1Z999AA10123456784 [🔗]      │
│ Status: In Transit                      │
│ Est. Delivery: Nov 23, 2025             │
│                                         │
│ Tracking History:                       │
│ • Nov 21, 8:00 PM - Departed facility   │
│ • Nov 21, 2:00 PM - In transit          │
│ • Nov 21, 10:00 AM - Picked up          │
└─────────────────────────────────────────┘
```

---

### Phase 2: Backend Integration (Day 1 - Afternoon)

#### 2.1 Medusa Service Updates
**File:** `src/app/shared/api/medusa.service.admin.ts`

**Add methods:**
```typescript
// Get shipment tracking info
getShipmentTracking(fulfillmentId: string, shipmentId: string): Observable<any>

// Update shipment tracking
updateShipmentTracking(fulfillmentId: string, shipmentId: string, data: {
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
}): Observable<any>

// Get tracking events from carrier (if Medusa supports it)
getCarrierTrackingEvents(trackingNumber: string, carrier: string): Observable<any>
```

#### 2.2 NGXS Actions & State
**File:** `src/app/store/orders/orders.actions.ts`

**New actions:**
```typescript
export class UpdateShipmentTracking {
  static readonly type = '[Orders] Update Shipment Tracking';
  constructor(readonly payload: {
    orderId: string;
    fulfillmentId: string;
    shipmentId: string;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: string;
  }) {}
}

export class FetchTrackingEvents {
  static readonly type = '[Orders] Fetch Tracking Events';
  constructor(readonly payload: {
    trackingNumber: string;
    carrier: string;
  }) {}
}

export class AutoMarkAsDelivered {
  static readonly type = '[Orders] Auto Mark As Delivered';
  constructor(readonly payload: {
    orderId: string;
    fulfillmentId: string;
    deliveryConfirmation: any;
  }) {}
}
```

**File:** `src/app/store/orders/orders.state.ts`

**Implement handlers:**
- Handle tracking updates
- Store tracking events in state
- Trigger auto-delivery when carrier confirms

---

### Phase 3: Tracking Integration (Day 2 - Morning)

#### 3.1 Third-Party Tracking APIs (Optional)

**Options:**
1. **AfterShip** - Multi-carrier tracking API
2. **EasyPost** - Shipping & tracking API
3. **ShipEngine** - Carrier-agnostic tracking
4. **Direct carrier APIs** - UPS, FedEx, etc.

**Service:** `src/app/services/tracking.service.ts` (CREATE)

```typescript
@Injectable({ providedIn: 'root' })
export class TrackingService {
  // Poll carrier API for tracking updates
  pollTrackingStatus(trackingNumber: string, carrier: string): Observable<TrackingEvent[]>
  
  // Check if package is delivered
  isDelivered(trackingNumber: string, carrier: string): Observable<boolean>
  
  // Get estimated delivery date
  getEstimatedDelivery(trackingNumber: string, carrier: string): Observable<Date>
}
```

#### 3.2 Automatic Delivery Detection

**Service:** `src/app/services/delivery-monitor.service.ts` (CREATE)

```typescript
@Injectable({ providedIn: 'root' })
export class DeliveryMonitorService {
  // Start monitoring shipments for delivery
  startMonitoring(shipments: Shipment[]): void
  
  // Stop monitoring
  stopMonitoring(): void
  
  // Emit events when delivery is detected
  onDeliveryDetected(): Observable<DeliveryEvent>
}
```

**Features:**
- Poll tracking APIs every 30 minutes for shipped orders
- Automatically mark as delivered when carrier confirms
- Send notification to admin when delivery is detected
- Update order timeline with delivery timestamp

---

### Phase 4: Notifications & Webhooks (Day 2 - Afternoon)

#### 4.1 Delivery Notifications

**Integrate with existing:** `src/app/services/order-events.service.ts`

**New events:**
```typescript
{
  type: 'shipment_tracking_updated',
  orderId: string,
  trackingNumber: string,
  status: string,
  timestamp: Date
}

{
  type: 'delivery_detected',
  orderId: string,
  fulfillmentId: string,
  deliveredAt: Date,
  signature?: string
}
```

#### 4.2 Webhook Handler (Backend)

**If using Medusa webhooks:**
- Listen for carrier delivery webhooks
- Update order fulfillment status
- Trigger SSE event to admin UI
- Send customer notification

---

### Phase 5: UI Polish & Testing (Day 3)

#### 5.1 Order Timeline Enhancements
**File:** `src/app/pages/order-detail/order-detail.helpers.ts`

**Add tracking events to timeline:**
```typescript
{
  type: 'shipment_tracking_updated',
  message: 'Package in transit - Last location: Memphis, TN',
  timestamp: Date,
  trackingNumber: string,
  carrier: string
}

{
  type: 'delivery_attempted',
  message: 'Delivery attempted - Customer not available',
  timestamp: Date
}

{
  type: 'out_for_delivery',
  message: 'Out for delivery',
  timestamp: Date,
  estimatedTime: '2:00 PM - 6:00 PM'
}
```

#### 5.2 Visual Indicators

**Shipment status badges:**
- 🟡 Label Created
- 🔵 Picked Up
- 🟣 In Transit
- 🟠 Out for Delivery
- 🟢 Delivered
- 🔴 Exception/Delayed

#### 5.3 Testing Checklist
- [ ] Create shipment with tracking number
- [ ] View tracking link opens carrier site
- [ ] Tracking events display correctly
- [ ] Auto-delivery detection works
- [ ] Manual "Mark as Delivered" still works
- [ ] Timeline shows all tracking events
- [ ] Notifications sent on delivery
- [ ] State updates correctly in NGXS
- [ ] Works with multiple fulfillments
- [ ] Error handling for invalid tracking numbers

---

## Data Model Changes

### Shipment Object Enhancement
```typescript
interface Shipment {
  id: string;
  fulfillment_id: string;
  tracking_number?: string;
  carrier?: string;
  carrier_tracking_url?: string;
  estimated_delivery?: Date;
  actual_delivery?: Date;
  tracking_events?: TrackingEvent[];
  status: 'label_created' | 'picked_up' | 'in_transit' | 
          'out_for_delivery' | 'delivered' | 'exception';
  metadata?: {
    carrier_service?: string;
    delivery_signature?: string;
    delivery_photo_url?: string;
    delivery_notes?: string;
  };
}

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
  carrier_code?: string;
}
```

---

## Configuration

### Environment Variables
```typescript
// src/environments/environment.ts
export const environment = {
  // ... existing config
  tracking: {
    enabled: true,
    provider: 'aftership', // or 'easypost', 'shipengine', 'manual'
    apiKey: 'your-api-key',
    pollInterval: 1800000, // 30 minutes
    autoMarkDelivered: true
  }
};
```

---

## Future Enhancements (Phase 6+)

### Advanced Features
1. **Customer Tracking Portal**
   - Public tracking page for customers
   - SMS/Email notifications on status changes
   - Delivery preferences (leave at door, signature required)

2. **Delivery Photos**
   - Display proof of delivery photos from carrier
   - Store in Medusa metadata

3. **Delivery Issues**
   - Handle delivery exceptions (damaged, lost, etc.)
   - Create claims automatically
   - Reship or refund workflows

4. **Analytics Dashboard**
   - Average delivery time by carrier
   - On-time delivery rate
   - Carrier performance comparison
   - Delivery heatmap

5. **Route Optimization**
   - For local deliveries
   - Driver assignment
   - Real-time GPS tracking

---

## Dependencies

### NPM Packages (if needed)
```json
{
  "aftership": "^5.0.0",  // If using AfterShip
  "easypost": "^5.0.0",   // If using EasyPost
  "moment-timezone": "^0.5.43"  // For delivery time zones
}
```

---

## Rollout Strategy

### Phase 1: MVP (Week 1)
- Basic shipment modal with tracking input
- Display tracking number with carrier link
- Manual "Mark as Delivered" (current functionality)

### Phase 2: Enhanced (Week 2)
- Tracking event display
- Carrier integration (one carrier to start)
- Automatic delivery detection

### Phase 3: Full Feature (Week 3)
- Multi-carrier support
- Webhooks integration
- Customer notifications
- Analytics

---

## Success Metrics

- ✅ Reduce manual "Mark as Delivered" clicks by 80%
- ✅ Delivery confirmation within 1 hour of actual delivery
- ✅ 95% tracking accuracy
- ✅ Zero missed deliveries
- ✅ Customer satisfaction increase

---

## Notes

- Start with manual tracking (no API integration) for MVP
- Add carrier APIs incrementally
- Consider Medusa's built-in fulfillment providers
- Ensure mobile-responsive design
- Add loading states for tracking fetches
- Handle rate limiting from carrier APIs
- Cache tracking data to reduce API calls

---

## Questions to Answer

1. Which carriers do you use most frequently?
2. Do you have access to carrier API credentials?
3. Should delivery be automatic or require manual confirmation?
4. Do you need customer-facing tracking pages?
5. What's your average order volume per day?
6. Do you handle local deliveries or only ship via carriers?

---

**Created:** November 21, 2025
**Status:** Planning Phase
**Priority:** High
**Estimated Effort:** 3 days
