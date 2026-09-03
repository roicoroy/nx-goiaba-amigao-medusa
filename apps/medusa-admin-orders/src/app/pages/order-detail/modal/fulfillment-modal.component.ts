import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { MedusaAdminService } from '../../../shared/api/medusa.service.admin';
import { Order } from '../../../shared/admin-interfaces';
import { LoadOrder } from '../../../store/orders/orders.actions';

// Data interfaces for fulfillment modal
interface StockLocation {
  id: string;
  name: string;
  address: {
    id: string;
    address_1: string;
    city: string;
    country_code: string;
    postal_code: string | null;
  };
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price_type: string;
  provider_id: string;
  service_zone_id: string;
  service_zone: {
    id: string;
    name: string;
    fulfillment_set: {
      id: string;
      location: {
        id: string;
      };
    };
  };
  type: {
    id: string;
    label: string;
    description: string;
    code: string;
  };
  prices: Array<{
    id: string;
    currency_code: string;
    amount: number;
  }>;
}

interface FulfillmentItem {
  id: string; // order line item id
  title: string;
  subtitle: string;
  thumbnail: string | null;
  variant_sku: string;
  quantity: number; // selected quantity to fulfill
  availableQuantity: number; // max available
  inStockQuantity: number; // current stock
  quantityError?: string; // validation error message
}

interface CreateFulfillmentPayload {
  location_id: string;
  shipping_option_id: string;
  items: Array<{
    id: string;
    quantity: number;
  }>;
}

@Component({
  selector: 'app-fulfillment-modal',
  templateUrl: './fulfillment-modal.component.html',
  styleUrls: ['./fulfillment-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class FulfillmentModalComponent implements OnInit {
  private store = inject(Store);
  private modalController = inject(ModalController);
  private medusaAdminService = inject(MedusaAdminService);
  private toastController = inject(ToastController);

  @Input() order!: Order;

  stockLocations: StockLocation[] = [];
  shippingOptions: ShippingOption[] = [];
  selectedLocationId: string = '';
  selectedShippingOptionId: string = '';
  fulfillmentItems: FulfillmentItem[] = [];
  isLoading: boolean = false;
  isLoadingShippingOptions: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  stockLocationsError: string = '';
  shippingOptionsError: string = '';
  hasStockLocationsError: boolean = false;
  hasShippingOptionsError: boolean = false;

  ngOnInit() {
    // Initialize fulfillment items from order
    this.initializeFulfillmentItems();

    // Load stock locations on component initialization
    this.loadStockLocations();
  }

  private initializeFulfillmentItems() {
    // Transform order items to fulfillment items
    if (this.order && this.order.items) {
      this.fulfillmentItems = this.order.items.map(item => {
        // Calculate available quantity (quantity not yet fulfilled)
        const availableQuantity = item.detail
          ? item.detail.quantity - item.detail.fulfilled_quantity
          : item.quantity;

        // In-stock quantity (for display purposes, using available as proxy)
        const inStockQuantity = availableQuantity;

        return {
          id: item.id,
          title: item.title,
          subtitle: item.subtitle || item.variant_title || '',
          thumbnail: item.thumbnail,
          variant_sku: item.variant_sku || '',
          quantity: availableQuantity, // Pre-populate with available quantity
          availableQuantity: availableQuantity,
          inStockQuantity: inStockQuantity
        };
      }).filter(item => item.availableQuantity > 0); // Only include items that can be fulfilled
    }
  }

  loadStockLocations() {
    this.isLoading = true;
    this.stockLocationsError = '';
    this.hasStockLocationsError = false;

    this.medusaAdminService.getStockLocations(50, 0).subscribe({
      next: (response) => {
        this.stockLocations = response.stock_locations || [];
        this.isLoading = false;
        this.hasStockLocationsError = false;

        // Pre-select first location on successful load
        if (this.stockLocations.length > 0) {
          this.selectedLocationId = this.stockLocations[0].id;
          // Trigger shipping options load for the pre-selected location
          this.onLocationChange();
        } else {
          this.stockLocationsError = 'No stock locations available. Please contact your administrator.';
          this.hasStockLocationsError = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasStockLocationsError = true;
        console.error('Failed to load stock locations:', error);

        // Extract error message from API response if available
        let errorMessage = 'Failed to load stock locations. Please try again.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.stockLocationsError = errorMessage;
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  onLocationChange() {
    // Clear current shipping option selection
    this.selectedShippingOptionId = '';
    this.shippingOptions = [];
    this.shippingOptionsError = '';

    // Load shipping options for the selected location
    if (this.selectedLocationId) {
      this.loadShippingOptions(this.selectedLocationId);
    }
  }

  loadShippingOptions(locationId: string) {
    this.isLoadingShippingOptions = true;
    this.shippingOptionsError = '';
    this.hasShippingOptionsError = false;

    // Call API with stock_location_id and fields parameter to get location associations
    this.medusaAdminService.getShippingOptions({
      stock_location_id: locationId,
      fields: '+service_zone.fulfillment_set.location.id',
      limit: 50,
      offset: 0
    }).subscribe({
      next: (response) => {
        // Filter options to match selected location
        const allOptions = response.shipping_options || [];
        this.shippingOptions = allOptions.filter(option => {
          // Check if the shipping option is associated with the selected location
          return option.service_zone?.fulfillment_set?.location?.id === locationId;
        });

        this.isLoadingShippingOptions = false;
        this.hasShippingOptionsError = false;

        // Pre-select shipping method matching customer's original selection
        const orderShippingMethods = this.order?.shipping_methods;
        if (this.shippingOptions.length > 0 && orderShippingMethods && orderShippingMethods.length > 0) {
          // Try to find a match with the customer's original shipping option
          const customerShippingOptionId = orderShippingMethods[0]?.shipping_option_id;
          const matchingOption = customerShippingOptionId
            ? this.shippingOptions.find(option => option.id === customerShippingOptionId)
            : undefined;

          if (matchingOption) {
            this.selectedShippingOptionId = matchingOption.id;
          } else {
            // If no match, pre-select the first available option
            this.selectedShippingOptionId = this.shippingOptions[0].id;
          }
        } else if (this.shippingOptions.length > 0) {
          // No customer shipping method, just select the first option
          this.selectedShippingOptionId = this.shippingOptions[0].id;
        }

        if (this.shippingOptions.length === 0) {
          this.shippingOptionsError = 'No shipping options available for this location.';
          this.hasShippingOptionsError = true;
        }
      },
      error: (error) => {
        this.isLoadingShippingOptions = false;
        this.hasShippingOptionsError = true;
        console.error('Failed to load shipping options:', error);

        // Extract error message from API response if available
        let errorMessage = 'Failed to load shipping options for selected location.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.shippingOptionsError = errorMessage;
        this.showToast(errorMessage, 'danger');
      }
    });
  }

  onQuantityChange(item: FulfillmentItem) {
    // Clear previous error
    item.quantityError = undefined;

    // Validate quantity is a valid number
    if (item.quantity === null || item.quantity === undefined || isNaN(item.quantity)) {
      item.quantityError = 'Please enter a valid quantity';
      return;
    }

    // Validate quantity is not negative
    if (item.quantity < 0) {
      item.quantity = 0;
      item.quantityError = 'Quantity cannot be negative';
      return;
    }

    // Validate quantity does not exceed available quantity
    if (item.quantity > item.availableQuantity) {
      item.quantity = item.availableQuantity;
      item.quantityError = `Quantity cannot exceed ${item.availableQuantity}`;
      return;
    }

    // Round to integer if decimal
    if (!Number.isInteger(item.quantity)) {
      item.quantity = Math.floor(item.quantity);
    }
  }

  private validateForm(): string[] {
    const errors: string[] = [];

    // Check that stock location is selected
    if (!this.selectedLocationId) {
      errors.push('Please select a stock location');
    }

    // Check that shipping option is selected
    if (!this.selectedShippingOptionId) {
      errors.push('Please select a shipping method');
    }

    // Check that at least one item has quantity > 0
    const hasItemsToFulfill = this.fulfillmentItems.some(item => item.quantity > 0);
    if (!hasItemsToFulfill) {
      errors.push('Please select at least one item to fulfill');
    }

    return errors;
  }

  createFulfillment() {
    // Validate form
    const validationErrors = this.validateForm();
    if (validationErrors.length > 0) {
      this.errorMessage = validationErrors.join('. ');
      return;
    }

    // Clear any previous error messages
    this.errorMessage = '';

    // Set loading state and disable submit button
    this.isSubmitting = true;

    // Build payload with location_id, shipping_option_id, and items array
    const payload: CreateFulfillmentPayload = {
      location_id: this.selectedLocationId,
      shipping_option_id: this.selectedShippingOptionId,
      items: this.fulfillmentItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          id: item.id,
          quantity: item.quantity
        }))
    };

    // Call medusaAdminService.createFulfillment() with order ID and payload
    this.medusaAdminService.createFulfillment(this.order.id, payload).subscribe({
      next: (response) => {
        // Handle success (subtask 7.3)
        this.handleFulfillmentSuccess();
      },
      error: (error) => {
        // Handle error (subtask 7.4)
        this.handleFulfillmentError(error);
      }
    });
  }

  private async handleFulfillmentSuccess() {
    // Show success toast notification
    await this.showToast('Fulfillment created successfully', 'success');

    // Dispatch LoadOrder action to refresh order state
    this.store.dispatch(new LoadOrder({ id: this.order.id }));

    // Close modal with success flag
    this.modalController.dismiss({
      success: true
    });
  }

  private async handleFulfillmentError(error: any) {
    // Re-enable submit button for retry
    this.isSubmitting = false;

    // Display API error message to user
    let errorMessage = 'Failed to create fulfillment. Please try again.';

    // Extract error message from API response if available
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Keep modal open with form data intact
    this.errorMessage = errorMessage;

    // Show error toast notification
    await this.showToast(errorMessage, 'danger');

    console.error('Failed to create fulfillment:', error);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async dismiss() {
    await this.modalController.dismiss({
      success: false
    });
  }
}
