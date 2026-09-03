# Implementation Plan

- [x] 1. Extend Medusa Admin Service with fulfillment API methods
  - Add `getStockLocations()` method to fetch stock locations with pagination parameters
  - Add `getShippingOptions()` method to fetch shipping options with optional stock location filter and fields parameter
  - Add `createFulfillment()` method to create fulfillments for orders
  - _Requirements: 1.1, 2.1, 4.4_

- [x] 2. Create data interfaces for fulfillment modal
  - Define `StockLocation` interface matching API response structure
  - Define `ShippingOption` interface with nested service zone and location data
  - Define `FulfillmentItem` interface for order items with quantity controls
  - Define `CreateFulfillmentPayload` interface for API request
  - _Requirements: 1.2, 2.3, 3.1, 4.4_

- [x] 3. Create fulfillment modal component structure
- [x] 3.1 Generate modal component files
  - Create `fulfillment-modal.component.ts` in `src/app/pages/order-detail/modal/`
  - Create `fulfillment-modal.component.html` template file
  - Create `fulfillment-modal.component.scss` styles file
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 3.2 Implement component initialization logic
  - Inject `ModalController`, `MedusaAdminService`, and `Store` dependencies
  - Accept `order` input via modal params
  - Initialize component properties (stockLocations, shippingOptions, fulfillmentItems arrays)
  - Implement `ngOnInit()` to trigger stock locations loading
  - _Requirements: 1.1, 1.5_

- [x] 4. Implement stock location selection feature
- [x] 4.1 Create stock locations loading logic
  - Implement `loadStockLocations()` method calling service API
  - Handle loading state with spinner
  - Handle API errors with user-friendly messages
  - Pre-select first location on successful load
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4.2 Build stock location dropdown UI
  - Create `ion-select` component for location selection
  - Bind to `selectedLocationId` property
  - Display location name and city in dropdown options
  - Handle empty state with appropriate message
  - _Requirements: 1.2, 1.3_

- [x] 5. Implement shipping method selection feature
- [x] 5.1 Create shipping options loading logic
  - Implement `loadShippingOptions(locationId)` method
  - Call API with `stock_location_id` and `fields=+service_zone.fulfillment_set.location.id` parameters
  - Filter options to match selected location
  - Pre-select shipping method matching customer's original selection
  - Handle loading and error states
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 5.2 Build shipping method dropdown UI
  - Create `ion-select` component for shipping method selection
  - Bind to `selectedShippingOptionId` property
  - Display shipping option name and type description
  - Show loading indicator while fetching options
  - _Requirements: 2.3_

- [x] 5.3 Implement location change handler
  - Create `onLocationChange()` method
  - Clear current shipping option selection
  - Reload shipping options for new location
  - _Requirements: 2.1, 2.4_

- [x] 6. Implement order items display and quantity controls
- [x] 6.1 Transform order items to fulfillment items
  - Map order items to `FulfillmentItem` interface
  - Extract product title, variant, thumbnail, and SKU
  - Calculate available and in-stock quantities from order item detail
  - Pre-populate quantity inputs with available quantity
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 6.2 Build items list UI
  - Create item cards with `ion-card` components
  - Display product thumbnail, title, and variant subtitle
  - Show available quantity and in-stock quantity labels
  - Create quantity input with `ion-input` type="number"
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6.3 Implement quantity validation
  - Create `onQuantityChange()` method
  - Validate quantity is between 0 and available quantity
  - Display validation errors inline
  - Update fulfillment items array with new quantities
  - _Requirements: 3.3, 3.5_

- [x] 7. Implement form validation and submission
- [x] 7.1 Create form validation logic
  - Implement `validateForm()` method
  - Check that stock location is selected
  - Check that shipping option is selected
  - Check that at least one item has quantity > 0
  - Return validation errors array
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.2 Implement fulfillment creation
  - Create `createFulfillment()` method
  - Build payload with location_id, shipping_option_id, and items array
  - Call `medusaAdminService.createFulfillment()` with order ID and payload
  - Handle loading state and disable submit button during request
  - _Requirements: 4.4, 4.7_

- [x] 7.3 Handle fulfillment creation success
  - Dispatch `LoadOrderDetails` action to refresh order state
  - Close modal with success flag
  - _Requirements: 4.5_

- [x] 7.4 Handle fulfillment creation errors
  - Display API error message to user
  - Keep modal open with form data intact
  - Re-enable submit button for retry
  - _Requirements: 4.6_

- [x] 8. Implement modal dismissal functionality
- [x] 8.1 Create cancel and close handlers
  - Implement `dismiss()` method to close modal without changes
  - Wire up Cancel button click handler
  - Configure modal to close on ESC key press
  - Configure modal to close on backdrop click
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Build modal template with Ionic components
- [x] 9.1 Create modal header
  - Add `ion-header` with toolbar
  - Add title "Create Fulfillment"
  - Add close button with X icon
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 9.2 Create modal content section
  - Add `ion-content` wrapper
  - Add location selector section
  - Add shipping method selector section
  - Add items to fulfill section with item cards
  - Implement scrollable content area
  - _Requirements: 1.2, 2.3, 3.1, 3.2, 3.3_

- [x] 9.3 Create modal footer
  - Add `ion-footer` with toolbar
  - Add Cancel button (secondary style)
  - Add Create Fulfillment button (primary style)
  - Bind button states to loading and validation
  - _Requirements: 4.7, 5.1_

- [x] 10. Style modal component
  - Create SCSS styles for modal layout
  - Style item cards with proper spacing
  - Style quantity inputs for mobile-friendly interaction
  - Add loading spinner styles
  - Add error message styles
  - Ensure responsive design for mobile and tablet
  - _Requirements: 1.2, 2.3, 3.1, 3.2, 3.3_

- [x] 11. Integrate modal with order detail page
- [x] 11.1 Add modal trigger to order detail page
  - Import `FulfillmentModalComponent` in order detail page
  - Create `openFulfillmentModal()` method
  - Add button or menu item to trigger modal
  - Pass order data to modal via componentProps
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 11.2 Handle modal dismissal
  - Listen for modal `onWillDismiss` event
  - Check for success flag in returned data
  - Refresh order details if fulfillment was created
  - _Requirements: 4.5_

- [x] 12. Add error handling and user feedback
  - Implement error display for stock locations load failure
  - Implement error display for shipping options load failure
  - Implement error display for fulfillment creation failure
  - Add retry buttons for failed API calls
  - Add loading indicators for all async operations
  - Add toast notifications for success/error feedback
  - _Requirements: 1.4, 2.1, 4.6_
