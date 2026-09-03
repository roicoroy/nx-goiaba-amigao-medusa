import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Order } from '../../shared/admin-interfaces';

@Component({
  selector: 'app-payment-capture-test',
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Payment Capture Debug</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div *ngIf="order">
          <h4>Order: {{ order.display_id }}</h4>
          <p><strong>Payment Status:</strong> {{ order.payment_status }}</p>
          <p><strong>Total:</strong> {{ order.total / 100 | currency:'GBP' }}</p>

          <div *ngIf="order.payment_collections && order.payment_collections.length > 0">
            <h5>Payment Collections:</h5>
            <div *ngFor="let collection of order.payment_collections">
              <p><strong>Collection ID:</strong> {{ collection.id }}</p>
              <p><strong>Status:</strong> {{ collection.status }}</p>
              <p><strong>Authorized:</strong> {{ collection.authorized_amount / 100 | currency:'GBP' }}</p>
              <p><strong>Captured:</strong> {{ collection.captured_amount / 100 | currency:'GBP' }}</p>
              <p><strong>Capturable:</strong> {{ (collection.authorized_amount - collection.captured_amount) / 100 | currency:'GBP' }}</p>

              <div *ngIf="collection.payments && collection.payments.length > 0">
                <h6>Payments:</h6>
                <div *ngFor="let payment of collection.payments">
                  <p><strong>Payment ID:</strong> {{ payment.id }}</p>
                  <p><strong>Amount:</strong> {{ payment.amount / 100 | currency:'GBP' }}</p>
                  <p><strong>Captured At:</strong> {{ payment.captured_at || 'Not captured' }}</p>
                  <p><strong>Provider:</strong> {{ payment.provider_id }}</p>
                  <hr>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PaymentCaptureTestComponent {
  @Input() order: Order | null = null;
}
