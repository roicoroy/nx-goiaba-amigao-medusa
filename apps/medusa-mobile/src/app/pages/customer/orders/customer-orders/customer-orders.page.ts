import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IonContent, IonList, IonItem, IonLabel, IonListHeader, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MedusaOrder } from 'src/app/shared/interfaces';
import { OrdersFacade } from 'src/app/store/orders/orders.facade';
import { ShortNumber, MedusaCurrency } from 'src/app/shared/pipes';
import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.page.html',
  styleUrls: ['./customer-orders.page.scss'],
  standalone: true,
  imports: [
    IonListHeader,
    IonLabel,
    IonItem,
    IonList,
    IonSpinner,
    CommonModule,
    IonContent,
    ShortNumber,
    MedusaCurrency,
    GoiabaHeaderComponent
  ]
})
export class CustomerOrdersPage implements OnInit, OnDestroy {
  storeOrders: MedusaOrder[] = [];
  loading = false;
  error: string | null = null;
  private router = inject(Router);
  private ordersFacade = inject(OrdersFacade);
  private readonly ngUnsubscribe = new Subject();

  ngOnInit(): void {
    // Subscribe to orders from facade
    this.ordersFacade.orders$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(orders => {
        this.storeOrders = orders;
      });

    // Subscribe to loading state
    this.ordersFacade.loading$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Subscribe to error state
    this.ordersFacade.error$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(error => {
        this.error = error;
      });

    // Load orders
    this.ordersFacade.loadOrders();
  }
  navigateOrderDetails(order: MedusaOrder) {
    if (!order?.id) {
      return;
    }
    this.router.navigate(
      ['/order-review'],
      { queryParams: { orderId: order.id, payment: false } }
    );
  }

  back() {
    this.router.navigate(['/customer/profile']);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
