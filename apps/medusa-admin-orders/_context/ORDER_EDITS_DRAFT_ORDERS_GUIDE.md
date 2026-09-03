# Order Edits & Draft Orders - Quick Guide

## Order Edits

Order edits allow you to modify items in an existing order after it has been placed.

### Create Order Edit

```typescript
// 1. Request an order edit
this.medusaAdmin.requestOrderEdit(orderId, {
  internal_note: 'Customer requested size change'
}).subscribe(response => {
  const orderEditId = response.order_edit.id;
});
```

### Modify Items

```typescript
// 2. Add a new item
this.medusaAdmin.addLineItemToOrderEdit(orderEditId, {
  variant_id: 'variant_new_size',
  quantity: 1
}).subscribe();

// 3. Update existing item quantity
this.medusaAdmin.updateOrderEditLineItem(orderEditId, itemId, {
  quantity: 2
}).subscribe();

// 4. Remove an item
this.medusaAdmin.removeLineItemFromOrderEdit(orderEditId, itemId).subscribe();
```

### Confirm or Cancel

```typescript
// Option A: Force confirm (admin approval)
this.medusaAdmin.confirmOrderEdit(orderEditId).subscribe(
  response => console.log('Order edit confirmed:', response)
);

// Option B: Request customer confirmation
this.medusaAdmin.requestOrderEditConfirmation(orderEditId).subscribe(
  response => console.log('Confirmation request sent to customer')
);

// Option C: Cancel the edit
this.medusaAdmin.cancelOrderEdit(orderEditId).subscribe(
  response => console.log('Order edit cancelled')
);
```

### View Order Edits

```typescript
// Get all edits for an order
this.medusaAdmin.getOrderEdits(orderId).subscribe(
  response => console.log('Order edits:', response.order_edits)
);

// Get specific order edit
this.medusaAdmin.getOrderEditById(orderEditId).subscribe(
  response => console.log('Order edit:', response.order_edit)
);

// List all order edits (across all orders)
this.medusaAdmin.getAllOrderEdits({
  limit: 20,
  offset: 0
}).subscribe(
  response => console.log('All edits:', response.order_edits)
);
```

## Draft Orders

Draft orders allow you to create orders on behalf of customers.

### Create Draft Order

```typescript
this.medusaAdmin.createDraftOrder({
  email: 'customer@example.com',
  region_id: 'reg_01HXYZ',
  items: [
    {
      variant_id: 'variant_01ABC',
      quantity: 2
    },
    {
      variant_id: 'variant_02DEF',
      quantity: 1
    }
  ],
  shipping_methods: [
    {
      option_id: 'so_01GHI',
      price: 500 // optional custom price in cents
    }
  ],
  customer_id: 'cus_01JKL', // optional, link to existing customer
  shipping_address: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'New York',
    country_code: 'us',
    postal_code: '10001'
  },
  billing_address: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'New York',
    country_code: 'us',
    postal_code: '10001'
  },
  discounts: [
    { code: 'SUMMER10' }
  ]
}).subscribe(response => {
  console.log('Draft order created:', response.draft_order);
});
```

### Modify Draft Order

```typescript
// Update draft order details
this.medusaAdmin.updateDraftOrder(draftOrderId, {
  email: 'newemail@example.com',
  shipping_address: {
    // updated address
  },
  no_notification_order: true // don't send confirmation email
}).subscribe();

// Add item to draft
this.medusaAdmin.addLineItemToDraftOrder(draftOrderId, {
  variant_id: 'variant_03MNO',
  quantity: 1
}).subscribe();

// Update item quantity
this.medusaAdmin.updateDraftOrderLineItem(draftOrderId, itemId, {
  quantity: 3
}).subscribe();

// Remove item
this.medusaAdmin.removeLineItemFromDraftOrder(draftOrderId, itemId).subscribe();
```

### Complete Draft Order

```typescript
// Register payment and convert to order
this.medusaAdmin.registerDraftOrderPayment(draftOrderId).subscribe(
  response => {
    console.log('Draft converted to order:', response.order);
    // Now you can capture payment, create fulfillment, etc.
  }
);
```

### Manage Draft Orders

```typescript
// List all draft orders
this.medusaAdmin.getDraftOrders({
  limit: 20,
  offset: 0,
  q: 'search term' // optional search
}).subscribe(
  response => console.log('Draft orders:', response.draft_orders)
);

// Get specific draft order
this.medusaAdmin.getDraftOrderById(draftOrderId).subscribe(
  response => console.log('Draft order:', response.draft_order)
);

// Delete draft order
this.medusaAdmin.deleteDraftOrder(draftOrderId).subscribe(
  response => console.log('Draft deleted:', response)
);
```

## Complete Workflow Examples

### Example 1: Customer Wants to Change Order Item

```typescript
async changeOrderItem(orderId: string, oldItemId: string, newVariantId: string) {
  // 1. Create order edit
  const editResponse = await this.medusaAdmin.requestOrderEdit(orderId, {
    internal_note: 'Customer wants different size'
  }).toPromise();
  
  const orderEditId = editResponse.order_edit.id;
  
  // 2. Remove old item
  await this.medusaAdmin.removeLineItemFromOrderEdit(
    orderEditId, 
    oldItemId
  ).toPromise();
  
  // 3. Add new item
  await this.medusaAdmin.addLineItemToOrderEdit(orderEditId, {
    variant_id: newVariantId,
    quantity: 1
  }).toPromise();
  
  // 4. Confirm the edit
  const confirmed = await this.medusaAdmin.confirmOrderEdit(
    orderEditId
  ).toPromise();
  
  console.log('Order updated:', confirmed);
}
```

### Example 2: Create Order for Walk-in Customer

```typescript
async createWalkInOrder(customerEmail: string, items: any[]) {
  // 1. Get region and shipping options
  const regions = await this.medusaAdmin.getRegions().toPromise();
  const regionId = regions.regions[0].id;
  
  const shippingOptions = await this.medusaAdmin.getShippingOptions().toPromise();
  const shippingOptionId = shippingOptions.shipping_options[0].id;
  
  // 2. Create draft order
  const draft = await this.medusaAdmin.createDraftOrder({
    email: customerEmail,
    region_id: regionId,
    items: items.map(item => ({
      variant_id: item.variantId,
      quantity: item.quantity
    })),
    shipping_methods: [
      { option_id: shippingOptionId }
    ],
    shipping_address: {
      first_name: 'Walk-in',
      last_name: 'Customer',
      address_1: 'Store Address',
      city: 'City',
      country_code: 'us',
      postal_code: '12345'
    }
  }).toPromise();
  
  // 3. Register payment (converts to order)
  const order = await this.medusaAdmin.registerDraftOrderPayment(
    draft.draft_order.id
  ).toPromise();
  
  // 4. Capture payment
  await this.medusaAdmin.capturePayment(order.order.id).toPromise();
  
  console.log('Walk-in order created:', order);
  return order;
}
```

### Example 3: Handle Order Edit Request

```typescript
async handleOrderEditRequest(orderId: string, changes: any[]) {
  // 1. Create order edit
  const edit = await this.medusaAdmin.requestOrderEdit(orderId, {
    internal_note: 'Customer requested changes via support'
  }).toPromise();
  
  const orderEditId = edit.order_edit.id;
  
  // 2. Apply all changes
  for (const change of changes) {
    if (change.action === 'add') {
      await this.medusaAdmin.addLineItemToOrderEdit(orderEditId, {
        variant_id: change.variantId,
        quantity: change.quantity
      }).toPromise();
    } else if (change.action === 'remove') {
      await this.medusaAdmin.removeLineItemFromOrderEdit(
        orderEditId,
        change.itemId
      ).toPromise();
    } else if (change.action === 'update') {
      await this.medusaAdmin.updateOrderEditLineItem(
        orderEditId,
        change.itemId,
        { quantity: change.quantity }
      ).toPromise();
    }
  }
  
  // 3. Request customer confirmation
  await this.medusaAdmin.requestOrderEditConfirmation(orderEditId).toPromise();
  
  console.log('Edit request sent to customer for confirmation');
}
```

## UI Component Example

```typescript
import { Component, OnInit } from '@angular/core';
import { MedusaAdminService } from './shared/api/medusa.service.admin';

@Component({
  selector: 'app-draft-order-create',
  template: `
    <div class="draft-order-form">
      <h2>Create Draft Order</h2>
      
      <!-- Customer Email -->
      <input [(ngModel)]="draftData.email" placeholder="Customer Email">
      
      <!-- Add Items -->
      <div *ngFor="let item of draftData.items; let i = index">
        <input [(ngModel)]="item.variant_id" placeholder="Variant ID">
        <input type="number" [(ngModel)]="item.quantity" placeholder="Qty">
        <button (click)="removeItem(i)">Remove</button>
      </div>
      
      <button (click)="addItem()">Add Item</button>
      
      <!-- Actions -->
      <button (click)="createDraft()">Create Draft</button>
      <button (click)="createAndComplete()" *ngIf="draftOrderId">
        Complete Order
      </button>
    </div>
  `
})
export class DraftOrderCreateComponent implements OnInit {
  draftData = {
    email: '',
    region_id: '',
    items: []
  };
  
  draftOrderId: string;
  regions: any[] = [];
  
  constructor(private medusaAdmin: MedusaAdminService) {}
  
  ngOnInit() {
    // Load regions
    this.medusaAdmin.getRegions().subscribe(response => {
      this.regions = response.regions;
      if (this.regions.length > 0) {
        this.draftData.region_id = this.regions[0].id;
      }
    });
  }
  
  addItem() {
    this.draftData.items.push({ variant_id: '', quantity: 1 });
  }
  
  removeItem(index: number) {
    this.draftData.items.splice(index, 1);
  }
  
  createDraft() {
    this.medusaAdmin.createDraftOrder(this.draftData).subscribe(
      response => {
        this.draftOrderId = response.draft_order.id;
        console.log('Draft created:', response.draft_order);
      }
    );
  }
  
  createAndComplete() {
    this.medusaAdmin.registerDraftOrderPayment(this.draftOrderId).subscribe(
      response => {
        console.log('Order created:', response.order);
        // Redirect to order details page
      }
    );
  }
}
```

## Best Practices

### Order Edits
1. **Always add internal notes** to track why edits were made
2. **Request customer confirmation** for significant changes
3. **Force confirm** only for minor corrections or when customer has agreed via other channels
4. **Check inventory** before adding new items
5. **Handle payment differences** - customer may need to pay more or receive refund

### Draft Orders
1. **Validate customer email** before creating draft
2. **Check product availability** before adding items
3. **Set appropriate shipping methods** based on customer location
4. **Apply discounts** if applicable
5. **Review totals** before completing the draft
6. **Delete abandoned drafts** regularly to keep data clean

## API Endpoints Reference

### Order Edits
- `POST /admin/orders/{id}/edits` - Create edit
- `GET /admin/orders/{id}/edits` - List edits for order
- `GET /admin/order-edits` - List all edits
- `GET /admin/order-edits/{id}` - Get edit details
- `POST /admin/order-edits/{id}` - Update edit
- `POST /admin/order-edits/{id}/items` - Add item
- `POST /admin/order-edits/{id}/items/{item_id}` - Update item
- `DELETE /admin/order-edits/{id}/items/{item_id}` - Remove item
- `POST /admin/order-edits/{id}/confirm` - Confirm edit
- `POST /admin/order-edits/{id}/cancel` - Cancel edit
- `POST /admin/order-edits/{id}/request` - Request confirmation

### Draft Orders
- `POST /admin/draft-orders` - Create draft
- `GET /admin/draft-orders` - List drafts
- `GET /admin/draft-orders/{id}` - Get draft details
- `POST /admin/draft-orders/{id}` - Update draft
- `DELETE /admin/draft-orders/{id}` - Delete draft
- `POST /admin/draft-orders/{id}/line-items` - Add item
- `POST /admin/draft-orders/{id}/line-items/{item_id}` - Update item
- `DELETE /admin/draft-orders/{id}/line-items/{item_id}` - Remove item
- `POST /admin/draft-orders/{id}/pay` - Register payment

## Official Documentation
- [Edit Order Items](https://docs.medusajs.com/user-guide/orders/edit)
- [Draft Orders](https://docs.medusajs.com/user-guide/orders/draft-orders)
- [Orders API](https://docs.medusajs.com/api/admin#orders)
