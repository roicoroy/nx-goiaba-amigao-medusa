import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngxs/store';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { NgxSliderModule, Options, ChangeContext } from '@angular-slider/ngx-slider';

import { ProductReviewsFacade, IProductReviewsFacadeState } from 'src/app/store/product-reviews/product-reviews.facade';
import { OrdersFacade } from 'src/app/store/orders/orders.facade';
import { AuthState } from 'src/app/store/auth/auth.state';
import { CreateReviewPayload, MedusaProductReview } from 'src/app/shared/interfaces';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-goiaba-review',
  templateUrl: './goiaba-review.component.html',
  styleUrls: ['./goiaba-review.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonIcon,
    NgxSliderModule
  ]
})
export class GoiabaReviewComponent implements OnInit, OnDestroy {
  @Input() productId!: string;

  viewState$!: Observable<IProductReviewsFacadeState>;

  private facade = inject(ProductReviewsFacade);
  private ordersFacade = inject(OrdersFacade);
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private alertController = inject(AlertController);
  private readonly ngUnsubscribe = new Subject<void>();

  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);

  reviewForm!: FormGroup;
  selectedRating = 0;
  isSubmitting = false;
  Math = Math; // Expose Math to template
  avatarErrorMap = new Map<string, boolean>(); // Track avatar load errors
  isDemoMode = true; // Set to true to allow reviews without purchased products

  // Slider configuration for rating
  ratingSliderOptions: Options = {
    floor: 0,
    ceil: 5,
    step: 0.5,
    showTicks: true,
    showTicksValues: false,
    showSelectionBar: true,
    translate: (value: number): string => {
      const stars = '⭐'.repeat(Math.floor(value));
      const halfStar = value % 1 !== 0 ? '½' : '';
      return `${stars}${halfStar} (${value})`;
    },
    getPointerColor: (value: number): string => {
      if (value < 2) return '#ef4444'; // Red for poor
      if (value < 3) return '#f59e0b'; // Orange for fair
      if (value < 4) return '#eab308'; // Yellow for good
      return '#10b981'; // Green for excellent
    },
    getSelectionBarColor: (value: number): string => {
      if (value < 2) return '#ef4444';
      if (value < 3) return '#f59e0b';
      if (value < 4) return '#eab308';
      return '#10b981';
    }
  };

  ngOnInit() {
    if (this.productId) {
      this.facade.loadReviews(this.productId);
      this.viewState$ = this.facade.viewState$;
    } else {
      console.error('GoiabaReviewComponent: No productId provided!');
    }

    // Load orders if user is logged in (needed for review submission)
    this.isLoggedIn$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(isLoggedIn => {
      if (isLoggedIn) {
        const orders = this.ordersFacade.getOrdersSnapshot();
        if (orders.length === 0) {
          this.ordersFacade.loadOrders();
        }
      }
    });

    // Initialize review form
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Set rating when user clicks on stars or uses slider
   */
  setRating(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
    this.reviewForm.get('rating')?.markAsTouched();
    this.reviewForm.get('rating')?.updateValueAndValidity();
  }

  /**
   * Handle slider rating change
   */
  onSliderRatingChange(changeContext: ChangeContext): void {
    this.setRating(changeContext.value);
  }

  /**
   * Find order and line item for a product
   * Only returns orders that belong to the current logged-in customer
   */
  private findOrderDataForProduct(productId: string): { orderId: string; orderLineItemId: string } | null {
    const orders = this.ordersFacade.getOrdersSnapshot();

    // Get current customer ID to verify orders belong to this customer
    const currentCustomer = this.store.selectSnapshot(AuthState.getCustomer);
    const currentCustomerId = currentCustomer?.id;

    if (!currentCustomerId) {
      console.warn('No customer logged in');
      return null;
    }

    if (!orders || orders.length === 0) {
      console.warn('No orders found for customer');
      return null;
    }

    console.log(`Searching for product ${productId} in ${orders.length} orders`);

    // Look through all orders to find one containing this product
    for (const order of orders) {
      // Verify order belongs to current customer
      if (order.customer_id !== currentCustomerId) {
        continue;
      }

      if (order.items && Array.isArray(order.items)) {
        // Find line item that matches the product
        const lineItem = order.items.find((item: any) => {
          const matches = item.product_id === productId ||
                 item.variant?.product_id === productId ||
                 item.product?.id === productId ||
                 item.title?.includes(productId);
          if (matches) {
            console.log(`Found matching item:`, item);
          }
          return matches;
        });

        if (lineItem && lineItem.id) {
          console.log(`Returning order data: orderId=${order.id}, lineItemId=${lineItem.id}`);
          return {
            orderId: order.id,
            orderLineItemId: lineItem.id
          };
        }
      }
    }

    console.warn(`Could not find order data for product ${productId}`);
    return null;
  }

  /**
   * Submit review form
   */
  async onSubmitReview(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.reviewForm.invalid || !this.productId || this.isSubmitting) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.reviewForm.controls).forEach(key => {
        this.reviewForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if user is logged in
    const isLoggedIn = this.store.selectSnapshot(AuthState.isLoggedIn);
    if (!isLoggedIn) {
      const alert = await this.alertController.create({
        header: 'Login Required',
        message: 'You must be logged in to submit a review.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Load orders if not already loaded
    const orders = this.ordersFacade.getOrdersSnapshot();
    if (orders.length === 0) {
      this.ordersFacade.loadOrders();
      // Wait a bit for orders to load
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Find order data for this product
    let orderData = this.findOrderDataForProduct(this.productId);

    // If no order found, check demo mode
    if (!orderData) {
      if (this.isDemoMode) {
        console.log('Demo mode: Creating review with demo order IDs');
        // Generate valid placeholder IDs for demo mode - backend requires these fields
        const demoOrderId = 'order_' + Math.random().toString(36).substr(2, 9);
        const demoLineItemId = 'line_' + Math.random().toString(36).substr(2, 9);
        orderData = {
          orderId: demoOrderId,
          orderLineItemId: demoLineItemId
        };
      } else {
        const alert = await this.alertController.create({
          header: 'Order Required',
          message: 'You can only review products you have purchased. Please purchase this product first.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
    }

    this.isSubmitting = true;
    const formValue = this.reviewForm.value;

    // Use selectedRating if form value is 0 or invalid, otherwise use form value
    const rating = this.selectedRating > 0 ? this.selectedRating : (formValue.rating || 0);

    if (rating === 0) {
      // Rating is required
      this.reviewForm.get('rating')?.markAsTouched();
      this.reviewForm.get('rating')?.setErrors({ required: true });
      this.isSubmitting = false;
      return;
    }

    // Build review payload - always include order fields as backend requires them
    const reviewPayload: any = {
      product_id: this.productId,
      rating: rating,
      title: formValue.title.trim(),
      content: formValue.content.trim(),
      order_id: orderData.orderId,
      order_line_item_id: orderData.orderLineItemId,
      images: [] // Required by API - empty array if no images
    };

    const payload: CreateReviewPayload = {
      reviews: [reviewPayload]
    };

    console.log('Submitting review:', payload);
    this.facade.submitReview(payload);

    // Monitor state changes to reset form on success or show error
    const subscription = this.viewState$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(state => {
      if (this.isSubmitting) {
        if (!state.loading) {
          // Loading finished
          if (!state.error) {
            // Success - reset form
            this.reviewForm.reset();
            this.selectedRating = 0;
            this.reviewForm.patchValue({ rating: 0 });
            // Reload reviews to show the new one
            this.facade.loadReviews(this.productId);
          } else {
            // Error occurred - show alert to user
            this.showErrorAlert(state.error);
          }
          this.isSubmitting = false;
          subscription.unsubscribe();
        }
      }
    });
  }

  /**
   * Show error alert to user
   */
  async showErrorAlert(errorMessage: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Review Submission Error',
      message: errorMessage,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Get customer display name from review
   */
  getCustomerName(review: MedusaProductReview): string {
    if (review.customer) {
      if (review.customer.first_name && review.customer.last_name) {
        return `${review.customer.first_name} ${review.customer.last_name}`;
      }
      if (review.customer.first_name) {
        return review.customer.first_name;
      }
      if (review.customer.email) {
        return review.customer.email.split('@')[0];
      }
    }
    return 'Anonymous';
  }

  /**
   * Get customer initials for avatar
   */
  getCustomerInitials(review: MedusaProductReview): string {
    if (review.customer) {
      if (review.customer.first_name && review.customer.last_name) {
        return `${review.customer.first_name[0]}${review.customer.last_name[0]}`.toUpperCase();
      }
      if (review.customer.first_name) {
        return review.customer.first_name[0].toUpperCase();
      }
      if (review.customer.email) {
        return review.customer.email[0].toUpperCase();
      }
    }
    return '?';
  }

  /**
   * Get customer avatar URL from review
   * Checks multiple sources: customer metadata, logged-in user's avatar, or returns null
   */
  getCustomerAvatar(review: MedusaProductReview): string | null {
    if (!review.customer) {
      return null;
    }

    // Source 1: Check customer metadata (from social logins like Google)
    const metadata = review.customer.metadata;
    if (metadata) {
      const avatarFromMetadata = metadata['picture'] || metadata['avatar_url'];
      if (avatarFromMetadata) {
        return avatarFromMetadata;
      }
    }

    // Source 2: For logged-in user's own reviews, check AuthState avatar
    const currentCustomer = this.store.selectSnapshot(AuthState.getCustomer);
    if (currentCustomer && review.customer.id === currentCustomer.id) {
      const loggedInAvatar = this.store.selectSnapshot(AuthState.getAvatar);
      if (loggedInAvatar) {
        return loggedInAvatar;
      }
    }

    // Source 3: No avatar available - will fall back to initials in template
    return null;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get filtered reviews (only approved/published)
   */
  getApprovedReviews(reviews: MedusaProductReview[]): MedusaProductReview[] {
    return reviews.filter(
      review => !review.status || review.status === 'approved' || review.status === 'published'
    );
  }
}
