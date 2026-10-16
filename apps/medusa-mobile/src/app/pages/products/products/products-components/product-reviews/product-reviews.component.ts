import { Component, OnInit, Input, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngxs/store';
import { IonSpinner, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonItem, IonLabel, IonTextarea, IonInput, IonText, IonBadge, IonAvatar } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
// import { fade } from 'src/app/shared/navigation/navigation.service';
import { ProductReviewsFacade, IProductReviewsFacadeState } from 'src/app/store/product-reviews/product-reviews.facade';
import { AuthState } from 'src/app/store/auth/auth.state';
import { OrdersState } from 'src/app/store/orders/orders.state';
import { OrdersActions } from 'src/app/store/orders/orders.actions';
import { OrdersFacade } from 'src/app/store/orders/orders.facade';
import { CreateReviewPayload, MedusaProductReview, MedusaOrder } from 'src/app/shared/interfaces';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-product-reviews',
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonTextarea,
    IonInput,
    IonText,
    IonAvatar
  ],
  animations: []
})
export class ProductReviewsComponent implements OnInit, OnDestroy {
  @Input() productId!: string;

  viewState$!: Observable<IProductReviewsFacadeState>;

  private facade = inject(ProductReviewsFacade);
  private ordersFacade = inject(OrdersFacade);
  private store = inject(Store);
  isLoggedIn$: Observable<boolean> = this.store.select(AuthState.isLoggedIn);
  private fb = inject(FormBuilder);
  private alertController = inject(AlertController);
  private readonly ngUnsubscribe = new Subject<void>();

  reviewForm!: FormGroup;
  selectedRating: number = 0;
  isSubmitting: boolean = false;
  Math = Math; // Expose Math to template
  avatarErrorMap = new Map<string, boolean>(); // Track avatar load errors

  ngOnInit() {
    if (this.productId) {
      this.facade.loadReviews(this.productId);
      this.viewState$ = this.facade.viewState$;
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
   * Set rating when user clicks on stars
   */
  setRating(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
    this.reviewForm.get('rating')?.markAsTouched();
    this.reviewForm.get('rating')?.updateValueAndValidity();
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
      // No customer logged in, cannot find orders
      return null;
    }

    // Look through all orders to find one containing this product
    // IMPORTANT: Only consider orders that belong to the current customer
    for (const order of orders) {
      // Verify order belongs to current customer
      if (order.customer_id !== currentCustomerId) {
        continue; // Skip orders from other customers
      }

      if (order.items && Array.isArray(order.items)) {
        // Find line item that matches the product
        const lineItem = order.items.find((item: any) => {
          // Check various possible fields for product_id
          return item.product_id === productId ||
                 item.variant?.product_id === productId ||
                 item.product?.id === productId ||
                 (item.variant_id && item.product_id === productId);
        });

        if (lineItem && lineItem.id) {
          return {
            orderId: order.id,
            orderLineItemId: lineItem.id
          };
        }
      }
    }

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
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find order data for this product
    const orderData = this.findOrderDataForProduct(this.productId);

    if (!orderData) {
      const alert = await this.alertController.create({
        header: 'Order Required',
        message: 'You can only review products you have purchased. Please purchase this product first.',
        buttons: ['OK']
      });
      await alert.present();
      return;
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

    const payload: CreateReviewPayload = {
      reviews: [{
        product_id: this.productId,
        rating: rating,
        title: formValue.title.trim(),
        content: formValue.content.trim(),
        order_id: orderData.orderId,
        order_line_item_id: orderData.orderLineItemId,
        images: [] // Required by API - empty array if no images
      }]
    };

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

