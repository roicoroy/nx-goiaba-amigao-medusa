import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardContent, IonRow, IonCol, IonText, IonImg, IonCardHeader, IonCardTitle, IonBadge, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MedusaOrder } from 'src/app/shared/interfaces';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';
import { MedusaCartState } from 'src/app/store/medusa-cart/medusa-cart.state';
import { NavigationService } from 'src/app/shared';
import { MedusaCurrency, ShortNumber } from 'src/app/shared/pipes';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';


export interface OrderIdParam {
  orderId: string
}
@Component({
  selector: 'app-order-review',
  templateUrl: './order-review.page.html',
  styleUrls: ['./order-review.page.scss'],
  standalone: true,
  imports: [IonText, IonCol, IonRow, IonCardContent, IonCard, IonContent, IonImg, IonCardHeader, IonCardTitle, IonBadge, IonButton, IonIcon, CommonModule, FormsModule, MedusaCurrency, ShortNumber, GoiabaHeaderComponent]
})
export class OrderReviewPage implements OnInit, OnDestroy, AfterViewInit {

  completedOrder$: Observable<MedusaOrder | null> = inject(Store).select(MedusaCartState.getCompletedOrder);
  orderId: string = '';
  fromPayment: boolean = false;
  order!: MedusaOrder;

  private store = inject(Store);
  private nav = inject(NavigationService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly ngUnsubscribe = new Subject();

  ngOnInit() {
    // Subscribe to order observable first
    this.completedOrder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: MedusaOrder | null) => {
        if (state) {
          this.order = state;
        }
      });

    // Then handle route params and dispatch action
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((params: Params) => {
        this.orderId = params['orderId'] || '';
        this.fromPayment = params['payment'] === 'true';

        if (this.orderId) {
          this.store.dispatch(new MedusaCartActions.RetriveCompletedOrder(this.orderId));
        }
      });
  }

  ngAfterViewInit() {
    // Moved subscription to ngOnInit to avoid timing issues
  }

  home() {
    // Navigate to main tabs (home) and clear cart state
    this.nav.navigateTo('/tabs');
    this.store.dispatch(new MedusaCartActions.LogOut());
  }

  onImageError(event: any) {
    // Fallback to a default product image
    event.target.src = 'assets/shapes.svg';
  }

  createReturn() {
    this.router.navigate(['/create-return'], {
      queryParams: { orderId: this.order.id }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'captured':
        return 'success';
      case 'pending':
        return 'warning';
      case 'canceled':
        return 'danger';
      case 'requires_action':
        return 'warning';
      default:
        return 'medium';
    }
  }

  canCreateReturn(status: string): boolean {
    // Allow returns for completed, captured, or fulfilled orders
    return ['completed', 'captured', 'fulfilled'].includes(status);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
