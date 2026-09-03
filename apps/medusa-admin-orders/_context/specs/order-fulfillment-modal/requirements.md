# Requirements Document

## Introduction

This document outlines the requirements for implementing an Order Fulfillment Modal feature in the store staff application. The feature enables store staff to create fulfillments for orders by selecting stock locations, shipping methods, and specifying item quantities to fulfill. The modal integrates with the Medusa Admin API to fetch available stock locations and shipping options, then creates fulfillments through the appropriate API endpoints.

## Glossary

- **Fulfillment System**: The Angular-based order fulfillment modal component and associated services
- **Medusa Admin API**: The backend API service that provides stock location, shipping option, and fulfillment creation endpoints
- **Stock Location**: A physical or virtual location where inventory is stored
- **Shipping Option**: A delivery method available for fulfilling orders (e.g., Express Shipping, Standard Shipping)
- **Order Item**: A line item within an order that can be fulfilled
- **Fulfillment**: The process of preparing and shipping order items to customers
- **Modal Component**: The Angular modal dialog that displays the fulfillment interface

## Requirements

### Requirement 1

**User Story:** As a store staff member, I want to view available stock locations when creating a fulfillment, so that I can select the appropriate warehouse to fulfill the order from.

#### Acceptance Criteria

1. WHEN THE Fulfillment System loads, THE Fulfillment System SHALL fetch stock locations from the Medusa Admin API endpoint `/admin/stock-locations` with pagination parameters
2. WHEN THE Medusa Admin API returns stock locations, THE Fulfillment System SHALL display each location name in a dropdown selector
3. WHEN THE stock locations list is empty, THE Fulfillment System SHALL display an appropriate message indicating no locations are available
4. THE Fulfillment System SHALL handle API errors gracefully and display error messages to the user
5. THE Fulfillment System SHALL pre-select the first available stock location by default

### Requirement 2

**User Story:** As a store staff member, I want to view and select shipping methods based on the selected stock location, so that I can choose the appropriate delivery method for the fulfillment.

#### Acceptance Criteria

1. WHEN A stock location is selected, THE Fulfillment System SHALL fetch shipping options from the Medusa Admin API endpoint `/admin/shipping-options` with the stock location ID parameter
2. THE Fulfillment System SHALL include the query parameter `fields=+service_zone.fulfillment_set.location.id` to retrieve location associations
3. WHEN THE Medusa Admin API returns shipping options, THE Fulfillment System SHALL display each shipping option name and description in a dropdown selector
4. THE Fulfillment System SHALL filter shipping options to only show those associated with the selected stock location
5. THE Fulfillment System SHALL pre-select the shipping method that matches the customer's original selection when available

### Requirement 3

**User Story:** As a store staff member, I want to view all order items with their available quantities, so that I can decide which items and quantities to fulfill.

#### Acceptance Criteria

1. WHEN THE Modal Component opens, THE Fulfillment System SHALL display all order items with their product titles, variants, and thumbnails
2. THE Fulfillment System SHALL display the available quantity and in-stock quantity for each order item
3. THE Fulfillment System SHALL provide quantity input controls for each order item allowing values between 0 and the available quantity
4. THE Fulfillment System SHALL pre-populate quantity inputs with the maximum available quantity for each item
5. THE Fulfillment System SHALL validate that quantity inputs do not exceed available stock

### Requirement 4

**User Story:** As a store staff member, I want to create a fulfillment by submitting the selected location, shipping method, and items, so that the order can be processed and shipped.

#### Acceptance Criteria

1. WHEN THE user clicks "Create Fulfillment", THE Fulfillment System SHALL validate that a stock location is selected
2. WHEN THE user clicks "Create Fulfillment", THE Fulfillment System SHALL validate that a shipping option is selected
3. WHEN THE user clicks "Create Fulfillment", THE Fulfillment System SHALL validate that at least one item has a quantity greater than zero
4. WHEN ALL validations pass, THE Fulfillment System SHALL send a POST request to `/admin/orders/{order_id}/fulfillments` with the payload containing location_id, shipping_option_id, and items array
5. WHEN THE Medusa Admin API successfully creates the fulfillment, THE Fulfillment System SHALL close the modal and refresh the order details
6. WHEN THE Medusa Admin API returns an error, THE Fulfillment System SHALL display the error message to the user without closing the modal
7. THE Fulfillment System SHALL disable the submit button while the request is in progress

### Requirement 5

**User Story:** As a store staff member, I want to cancel the fulfillment creation process, so that I can exit the modal without making changes to the order.

#### Acceptance Criteria

1. THE Fulfillment System SHALL display a "Cancel" button in the modal footer
2. WHEN THE user clicks "Cancel", THE Fulfillment System SHALL close the modal without making any API calls
3. WHEN THE user clicks "Cancel", THE Fulfillment System SHALL discard any changes made in the form
4. WHEN THE user presses the ESC key, THE Fulfillment System SHALL close the modal
5. WHEN THE user clicks outside the modal, THE Fulfillment System SHALL close the modal
