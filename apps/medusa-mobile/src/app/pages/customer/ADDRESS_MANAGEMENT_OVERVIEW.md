# Address Management Components Overview

## Current Architecture

### Core Components

#### 1. **AddressFormComponent** (Reusable Form)
**Location:** `apps/medusa-mobile/src/app/components/forms/address-form/`

**Purpose:** Reusable address form component that implements `ControlValueAccessor` for use in reactive forms.

**Features:**
- Implements `ControlValueAccessor` interface (can be used with `formControlName`)
- Configurable inputs:
  - `addressType`: 'billing' | 'shipping' | 'general'
  - `showEmail`: boolean
  - `showCompany`: boolean
  - `required`: boolean
  - `initialData`: Partial<AddressFormData>
  - `disabled`: boolean
- Outputs:
  - `formValid`: EventEmitter<boolean>
  - `formData`: EventEmitter<AddressFormData>
  - `validationErrors`: EventEmitter<Map<string, string>>
- Public methods:
  - `writeValue(value)`: Pre-populate form
  - `isValid()`: Check form validity
  - `getValue()`: Get form data
  - `markAllAsTouched()`: Trigger validation
  - `reset()`: Reset form
  - `getFormattedAddress()`: Get formatted address string
- Auto-loads regions/countries from state
- Auto-sets default country from region state

**Current Usage:**
- Used in `add-address.page.html` (line 22)
- Used in `manage-address.page.html` (line 28)

**Form Fields:**
- first_name, last_name (required, minLength: 2)
- address_1 (required)
- address_2 (optional)
- city (required)
- country_code (required, dropdown from regions)
- postal_code (required, pattern: 3-10 alphanumeric)
- phone (required, pattern: digits/spaces/+/-/())
- province (optional)
- company (optional, shown if `showCompany=true`)
- email (optional, shown if `showEmail=true`)

#### 2. **add-address.page** (Add New Address)
**Location:** `apps/medusa-mobile/src/app/pages/customer/add-address/`

**Purpose:** Standalone page for adding new customer addresses.

**Features:**
- Uses `AddressFormComponent` with `[required]="true"` and `[showCompany]="true"`
- Dispatches `AuthActions.AddACustomerAddress` on submit
- Supports `returnUrl` query parameter for navigation after success
- Has cancel button that navigates back
- Uses `@ViewChild` to access form component methods

**Navigation:**
- Accessed from: `medusa-profile.page`, `customer-address.page`, `default-addresses-list.component`, `smart-checkout.page`

**Route:** `/add-address?returnUrl=<encoded_url>`

#### 3. **manage-address.page** (Edit Address)
**Location:** `apps/medusa-mobile/src/app/pages/customer/manage-address/`

**Purpose:** Standalone page for editing existing customer addresses.

**Features:**
- Uses `AddressFormComponent` with `[required]="true"` and `[showCompany]="true"`
- Requires `addressId` query parameter
- Loads address from customer's addresses array in state (`AuthState.getCustomer`)
- Pre-populates form using `addressFormComponent.writeValue()` with setTimeout (100ms delay)
- Dispatches `AuthActions.UpdateCustomerAddress` on submit
- Supports `returnUrl` query parameter
- Shows loading state while fetching address

**Navigation:**
- Accessed from: `default-addresses-list.component` (edit button)

**Route:** `/manage-address?addressId=<id>&returnUrl=<encoded_url>`

#### 4. **customer-address.page** (Address Management Hub)
**Location:** `apps/medusa-mobile/src/app/pages/customer/customer-address/`

**Purpose:** Standalone page that displays address management interface.

**Features:**
- Uses `default-addresses-list.component` to show all addresses
- Uses `default-addresses-view.component` to show default addresses
- Has "Add New Address" button
- Dispatches `AuthActions.GetSession()` on init
- Uses `AppFacade.viewState$` for customer data

**Current Status:** Appears to be a standalone page, but functionality overlaps with `medusa-profile.page`

**Route:** `/customer-address`

#### 5. **default-addresses-list.component** (Address List with Actions)
**Location:** `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-list/`

**Purpose:** Displays list of all customer addresses with management actions.

**Features:**
- Takes `customer` as input (`MedusaCustomer | null`)
- Shows all addresses using `app-address-view` component
- Actions per address:
  - Set as default billing (dispatches `AuthActions.SetDefaultCustomerBillingAddress`)
  - Set as default shipping (dispatches `AuthActions.SetDefaultCustomerShippingAddress`)
  - Edit (navigates to `manage-address` page with `addressId` and `returnUrl`)
  - Delete (dispatches `AuthActions.DeleteCustomerAddress`)
- Has "Add New Address" button (navigates to `add-address` with `returnUrl`)
- Maintains local copy of addresses (`localAddresses`) to preserve order
- Uses `trackByAddressId` for list rendering
- Implements `OnChanges` to sync with customer prop changes
- Optimistic UI updates for default address toggles

**Usage:**
- Used in `medusa-profile.page.html` (line 94)
- Used in `customer-address.page.html` (line 26)

#### 6. **default-addresses-view.component** (Default Addresses Display)
**Location:** `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-view/`

**Purpose:** Displays default billing and shipping addresses in a card layout.

**Features:**
- Takes `customer` as input (`MedusaCustomer | null`)
- Shows default billing address (if exists) in a card
- Shows default shipping address (if exists) in a card
- Uses `app-address-view` component for display
- Shows empty states if no addresses or no defaults set
- Grid layout (responsive: 12 cols mobile, 6 cols tablet+)

**Computed Properties:**
- `billingAddress`: Finds address where `is_default_billing === true`
- `shippingAddress`: Finds address where `is_default_shipping === true`
- `hasAddresses`: Checks if customer has any addresses

**Usage:**
- Used in `medusa-profile.page.html` (line 95)
- Used in `customer-address.page.html` (line 27)

#### 7. **AddressViewComponent** (Address Display)
**Location:** `apps/medusa-mobile/src/app/pages/smart-checkout/address-view/`

**Purpose:** Displays a formatted address (read-only).

**Features:**
- Takes `address` as input (`MedusaAddress`)
- Takes `showActions` as input (boolean, default: true)
- Takes `isDefaultBilling` and `isDefaultShipping` as inputs
- Displays formatted address with:
  - Name (first_name + last_name)
  - Address lines (address_1, address_2)
  - City and postal code
  - Country code
  - Phone number
  - Company name
- Shows badges for default billing/shipping
- Optional edit/delete buttons (if `showActions=true`)

**Usage:**
- Used in `default-addresses-list.component` (displays each address)
- Used in `default-addresses-view.component` (displays default addresses)
- Used in checkout flow

## Component Relationships

```
medusa-profile.page (Profile page with tabs)
  ├── default-addresses-list.component (shows all addresses with actions)
  └── default-addresses-view.component (shows default billing/shipping)

customer-address.page (Standalone address management page)
  ├── default-addresses-list.component (shows all addresses with actions)
  └── default-addresses-view.component (shows default billing/shipping)

add-address.page (Add new address)
  └── AddressFormComponent (form for new address)

manage-address.page (Edit existing address)
  └── AddressFormComponent (form for editing address)

default-addresses-list.component (Address list with actions)
  ├── AddressViewComponent (displays each address)
  └── Navigation to add-address / manage-address pages

default-addresses-view.component (Default addresses display)
  └── AddressViewComponent (displays default addresses)
```

## Data Flow

### Adding Address
1. User clicks "Add New Address" → Navigate to `/add-address?returnUrl=...`
2. `add-address.page` renders `AddressFormComponent`
3. User fills form → `AddressFormComponent` validates
4. User submits → `add-address.page` calls `addressFormComponent.getValue()`
5. Dispatch `AuthActions.AddACustomerAddress(addressData)`
6. On success → Navigate back to `returnUrl` or previous page

### Editing Address
1. User clicks "Edit" on address → Navigate to `/manage-address?addressId=...&returnUrl=...`
2. `manage-address.page` loads address from `AuthState.getCustomer.addresses`
3. Pre-populate form using `addressFormComponent.writeValue(formData)`
4. User modifies form → `AddressFormComponent` validates
5. User submits → `manage-address.page` calls `addressFormComponent.getValue()`
6. Dispatch `AuthActions.UpdateCustomerAddress(addressId, addressData)`
7. On success → Navigate back to `returnUrl` or previous page

### Setting Default Addresses
1. User clicks "Set as Billing/Shipping" → `default-addresses-list.component`
2. Dispatch `AuthActions.SetDefaultCustomerBillingAddress(addressId, true)` or
   `AuthActions.SetDefaultCustomerShippingAddress(addressId, true)`
3. Optimistic UI update (local state) for instant feedback
4. State update propagates to all components via `AuthState.getCustomer`

### Deleting Address
1. User clicks "Delete" → `default-addresses-list.component`
2. Dispatch `AuthActions.DeleteCustomerAddress(addressId)`
3. State update removes address from customer.addresses array
4. UI updates automatically via reactive state

## Current Issues & Observations

### 1. **Redundancy Between customer-address.page and medusa-profile.page**

**Identified Redundancies:**

1. **Duplicate Functionality:**
   - `customer-address.page` and `medusa-profile.page` (Address tab) both display:
     - All addresses list (`default-addresses-list.component`)
     - Default addresses view (`default-addresses-view.component`)
     - "Add New Address" button
   - Both use identical components with identical props
   - Both show the same customer address data

2. **Different Entry Points:**
   - `customer-address.page`: Standalone route `/customer-address`
     - Accessed from: `auth.page.ts` (after login, line 154) - `navigateToAddresses()`
     - Has its own header with back button
   - `medusa-profile.page`: Tab within profile page `/customer/profile`
     - Address tab is one of 5 tabs (Profile, Information, Address, Notification, Password)
     - Uses `GoiabaHeaderComponent` with menu button

3. **Component Location:**
   - `default-addresses-list` and `default-addresses-view` are in `customer-address/` folder
   - But they're imported and used in `medusa-profile.page`
   - This creates a dependency: profile page depends on customer-address folder components

4. **Navigation References:**
   - `app.routes.ts`: Has route for `customer-address` page (line 61-64)
   - `auth.page.ts`: Navigates to `customer-address` after login (line 154)
   - `medusa-profile.page`: Uses address components but doesn't navigate to customer-address page
   - Menu in `app.component.html`: Has link to `/manage-address` but not to `customer-address`

**Analysis:**
- `customer-address.page` appears to be a standalone address management page
- `medusa-profile.page` has address management as one tab among many
- Both serve the same purpose but in different contexts
- The components are well-reused, but having two entry points creates confusion

**Recommendation Options:**

**Option A: Remove customer-address.page (Recommended)**
- Remove route from `app.routes.ts`
- Update `auth.page.ts` to navigate to `/customer/profile` (address tab) instead
- Keep address management only in `medusa-profile.page` Address tab
- Pros: Single source of truth, less confusion, cleaner codebase
- Cons: Users must go through profile page to manage addresses

**Option B: Keep customer-address.page, Remove Address Tab from Profile**
- Remove address tab from `medusa-profile.page`
- Make `customer-address.page` the primary address management interface
- Update all navigation to use `customer-address` page
- Pros: Dedicated address management page, cleaner profile page
- Cons: More navigation steps, loses tab-based organization

**Option C: Keep Both, Make customer-address.page Redirect to Profile**
- Keep `customer-address` route but redirect to profile address tab
- Maintains backward compatibility for any external links
- Pros: No breaking changes
- Cons: Still maintains redundancy in codebase

### 2. **Navigation Patterns Analysis**

**Current Navigation Methods for Add Address:**

1. **medusa-profile.page.ts** (line 112):
   ```typescript
   this.router.navigate(['/add-address'], {
     queryParams: { returnUrl: '/customer/profile' }
   });
   ```
   - Uses: `Router.navigate()` with queryParams object
   - Hardcoded returnUrl: `/customer/profile`

2. **customer-address.page.ts** (line 53):
   ```typescript
   this.nav.navigateTo(`add-address?returnUrl=${encodeURIComponent(currentUrl)}`);
   ```
   - Uses: `NavigationService.navigateTo()` with query string
   - Dynamic returnUrl: current page URL

3. **default-addresses-list.component.ts** (line 113):
   ```typescript
   const url = `add-address?returnUrl=${encodeURIComponent(currentUrl)}`;
   this.router.navigateByUrl(url);
   ```
   - Uses: `Router.navigateByUrl()` with full URL string
   - Dynamic returnUrl: current page URL

4. **smart-checkout.page.ts** (lines 1140, 1168):
   ```typescript
   this.nav.navigateTo('add-address');
   ```
   - Uses: `NavigationService.navigateTo()` without returnUrl
   - No returnUrl parameter (user must navigate back manually)

**Current Navigation Methods for Manage Address:**

1. **default-addresses-list.component.ts** (line 123):
   ```typescript
   const url = `/manage-address?addressId=${address.id}&returnUrl=${encodeURIComponent(currentUrl)}`;
   this.router.navigateByUrl(url);
   ```
   - Uses: `Router.navigateByUrl()` with full URL string
   - Includes both `addressId` and `returnUrl`

**Navigation to customer-address page:**

1. **auth.page.ts** (line 154):
   ```typescript
   this.navigationService.navigateTo('customer-address');
   ```
   - Uses: `NavigationService.navigateTo()`
   - No returnUrl (standalone page)

**Issues Identified:**

1. **Inconsistent Methods:**
   - Three different navigation methods used: `router.navigate()`, `nav.navigateTo()`, `router.navigateByUrl()`
   - No standard pattern across components

2. **Inconsistent returnUrl Handling:**
   - Some hardcode returnUrl (`medusa-profile`)
   - Some use current URL (`customer-address`, `default-addresses-list`)
   - Some omit returnUrl entirely (`smart-checkout`)

3. **URL Encoding:**
   - Some manually encode (`encodeURIComponent`)
   - Some don't encode (could break with special characters)

4. **NavigationService vs Router:**
   - Mixed usage of `NavigationService` and `Router` directly
   - `NavigationService` is a wrapper but not consistently used

**Recommendation: Standardize Navigation**

Create centralized helper methods in `NavigationService`:

```typescript
// In NavigationService
navigateToAddAddress(returnUrl?: string): void {
  const url = returnUrl || this.router.url;
  this.router.navigate(['/add-address'], {
    queryParams: { returnUrl: encodeURIComponent(url) }
  });
}

navigateToManageAddress(addressId: string, returnUrl?: string): void {
  const url = returnUrl || this.router.url;
  this.router.navigate(['/manage-address'], {
    queryParams: {
      addressId: addressId,
      returnUrl: encodeURIComponent(url)
    }
  });
}

navigateToCustomerAddress(): void {
  this.router.navigate(['/customer-address']);
}
```

**Update all components to use these methods:**
- `medusa-profile.page.ts` → `nav.navigateToAddAddress('/customer/profile')`
- `customer-address.page.ts` → `nav.navigateToAddAddress()`
- `default-addresses-list.component.ts` → `nav.navigateToAddAddress()` and `nav.navigateToManageAddress(addressId)`
- `smart-checkout.page.ts` → `nav.navigateToAddAddress()`
- `auth.page.ts` → `nav.navigateToCustomerAddress()`

**Benefits:**
- Consistent navigation pattern
- Automatic returnUrl handling (defaults to current page)
- Proper URL encoding
- Single source of truth for navigation logic
- Easier to maintain and update

### 3. **Form Component Usage**
- `AddressFormComponent` is well-designed and reusable
- Currently only used in `add-address` and `manage-address` pages
- Could potentially be used in modals for inline editing
- Implements `ControlValueAccessor` but not currently used with `formControlName` in reactive forms
- Has good validation and error handling

**Potential Improvements:**
- Consider creating a modal wrapper for quick address edits
- Could be used inline in `default-addresses-list` for faster editing
- The `writeValue()` method uses a setTimeout hack (100ms) - could be improved with proper lifecycle hooks

### 4. **State Management**
- All address operations use `AuthActions`:
  - `AddACustomerAddress(addressData: MedusaAddress)`
  - `UpdateCustomerAddress(addressId: string, addressData: MedusaAddress)`
  - `DeleteCustomerAddress(addressId: string)`
  - `SetDefaultCustomerBillingAddress(addressId: string, isDefault: boolean)`
  - `SetDefaultCustomerShippingAddress(addressId: string, isDefault: boolean)`
- Customer data comes from `AuthState.getCustomer`
- All components subscribe to customer state changes
- `default-addresses-list` maintains local copy for order preservation

### 5. **Component Organization**
- `default-addresses-list` and `default-addresses-view` are in `customer-address` folder but used in multiple places
- `AddressViewComponent` is in `smart-checkout` folder but used in customer address management
- Could be better organized in a shared location

**Recommendation:**
- Move `default-addresses-list` and `default-addresses-view` to `components/customer/` or `components/addresses/`
- Move `AddressViewComponent` to `components/addresses/` or keep in current location if checkout-specific

### 6. **Form Pre-population Issue**
- `manage-address.page` uses `setTimeout(100ms)` to wait for form initialization before calling `writeValue()`
- This is a workaround for timing issues - could be improved with proper lifecycle management

## Recommendations

### 1. **Consolidate Pages**
- **Option A:** Remove `customer-address.page` if `medusa-profile.page` already provides the same functionality
  - Check all routes/navigation that point to `customer-address`
  - Update to point to `medusa-profile` with address tab
  - Remove route from `app.routes.ts`
  
- **Option B:** Make `customer-address.page` the main address management page
  - Remove address tab from `medusa-profile.page`
  - Update all navigation to use `customer-address` page
  - Keep profile page focused on profile information only

### 2. **Standardize Navigation**
- Create helper methods in `NavigationService`:
  ```typescript
  navigateToAddAddress(returnUrl?: string): void {
    const currentUrl = this.router.url;
    const url = returnUrl || currentUrl;
    this.router.navigate(['/add-address'], {
      queryParams: { returnUrl: encodeURIComponent(url) }
    });
  }

  navigateToManageAddress(addressId: string, returnUrl?: string): void {
    const currentUrl = this.router.url;
    const url = returnUrl || currentUrl;
    this.router.navigate(['/manage-address'], {
      queryParams: {
        addressId: addressId,
        returnUrl: encodeURIComponent(url)
      }
    });
  }
  ```
- Update all components to use these methods

### 3. **Improve Form Component Usage**
- Remove `setTimeout` hack in `manage-address.page`
- Use `AfterViewInit` or `ViewChild` with proper initialization check
- Consider creating a modal version for inline editing
- Leverage `ControlValueAccessor` interface more effectively

### 4. **Component Organization**
- Move shared address components to a common location:
  - `components/addresses/address-view/` (move from smart-checkout)
  - `components/addresses/default-addresses-list/` (move from customer-address)
  - `components/addresses/default-addresses-view/` (move from customer-address)
- Or create a `components/customer/addresses/` folder structure

### 5. **Enhance AddressFormComponent**
- Add support for inline editing mode
- Improve initialization timing (remove setTimeout dependency)
- Add loading states
- Better error handling and display

## Files Reference

### Core Form Component
- `apps/medusa-mobile/src/app/components/forms/address-form/address-form.component.ts`
- `apps/medusa-mobile/src/app/components/forms/address-form/address-form.component.html`
- `apps/medusa-mobile/src/app/components/forms/index.ts` (exports)

### Pages
- `apps/medusa-mobile/src/app/pages/customer/add-address/add-address.page.ts`
- `apps/medusa-mobile/src/app/pages/customer/add-address/add-address.page.html`
- `apps/medusa-mobile/src/app/pages/customer/manage-address/manage-address.page.ts`
- `apps/medusa-mobile/src/app/pages/customer/manage-address/manage-address.page.html`
- `apps/medusa-mobile/src/app/pages/customer/customer-address/customer-address.page.ts`
- `apps/medusa-mobile/src/app/pages/customer/customer-address/customer-address.page.html`

### Display Components
- `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-list/default-addresses-list.component.ts`
- `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-list/default-addresses-list.component.html`
- `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-view/default-addresses-view.component.ts`
- `apps/medusa-mobile/src/app/pages/customer/customer-address/default-addresses-view/default-addresses-view.component.html`
- `apps/medusa-mobile/src/app/pages/smart-checkout/address-view/address-view.component.ts`
- `apps/medusa-mobile/src/app/pages/smart-checkout/address-view/address-view.component.html`

### Integration Points
- `apps/medusa-mobile/src/app/pages/customer/medusa-profile/medusa-profile.page.html` (lines 83-98)
- `apps/medusa-mobile/src/app/pages/customer/medusa-profile/medusa-profile.page.ts`
- `apps/medusa-mobile/src/app/app.routes.ts` (routes configuration)

## Navigation Flow Diagram

```
User Actions:
├── View Addresses
│   ├── medusa-profile.page (Address tab)
│   │   ├── default-addresses-list (all addresses)
│   │   └── default-addresses-view (default addresses)
│   └── customer-address.page (standalone)
│       ├── default-addresses-list (all addresses)
│       └── default-addresses-view (default addresses)
│
├── Add Address
│   └── add-address.page
│       └── AddressFormComponent
│           └── Submit → AuthActions.AddACustomerAddress
│
├── Edit Address
│   └── manage-address.page
│       └── AddressFormComponent (pre-populated)
│           └── Submit → AuthActions.UpdateCustomerAddress
│
├── Set Default Address
│   └── default-addresses-list.component
│       ├── Set Billing → AuthActions.SetDefaultCustomerBillingAddress
│       └── Set Shipping → AuthActions.SetDefaultCustomerShippingAddress
│
└── Delete Address
    └── default-addresses-list.component
        └── AuthActions.DeleteCustomerAddress
```

## State Management Flow

```
AuthState.getCustomer
    ↓
customer.addresses[] (array of MedusaAddress)
    ↓
Components subscribe to customer state:
    ├── default-addresses-list (shows all addresses)
    ├── default-addresses-view (shows defaults)
    └── manage-address (loads specific address for editing)

Actions dispatched:
    ├── AddACustomerAddress → Updates customer.addresses
    ├── UpdateCustomerAddress → Updates specific address in array
    ├── DeleteCustomerAddress → Removes address from array
    ├── SetDefaultCustomerBillingAddress → Updates is_default_billing flags
    └── SetDefaultCustomerShippingAddress → Updates is_default_shipping flags
```
