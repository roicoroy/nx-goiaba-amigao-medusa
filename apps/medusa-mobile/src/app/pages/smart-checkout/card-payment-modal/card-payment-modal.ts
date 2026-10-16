import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { ModalController, IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonRow, IonCol, IonSpinner, IonFooter, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { NgxStripeModule, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { lastValueFrom, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/alert/alert.service';
import { Store } from '@ngxs/store';
import { PaymentIntentResult } from '@stripe/stripe-js';
import { CheckoutActions } from 'src/app/store/checkout/checkout.actions';
import { MedusaCartActions } from 'src/app/store/medusa-cart/medusa-cart.actions';

@Component({
  selector: 'card-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgxStripeModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonRow,
    IonCol,
    IonSpinner,
    IonFooter,
    IonIcon,
    IonLabel
  ],
  templateUrl: './card-payment-modal.html',
  styleUrls: ['./card-payment-modal.scss'],
})
export class CardPaymentModal implements OnDestroy {

  @ViewChild(StripePaymentElementComponent) paymentElement!: StripePaymentElementComponent;

  @Input() secret_key: string = '';

  private modalController = inject(ModalController);
  private stripeService = inject(StripeService);
  private router = inject(Router);
  private alert = inject(AlertService);
  private store = inject(Store);
  private readonly ngUnsubscribe = new Subject();

  private isProcessing = false; // Prevent multiple simultaneous payment attempts

  async confirmPayment() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      if (!this.paymentElement?.elements) {
        this.alert.presentSimpleAlertNavigate(
          'Payment form not ready. Please try again.',
          '/tabs/cart'
        );
        await this.closeModal();
        return;
      }

      if (!this.secret_key || !this.secret_key.startsWith('pi_')) {
        this.alert.presentSimpleAlertNavigate(
          'Payment session not initialized. Please try again.',
          '/tabs/cart'
        );
        await this.closeModal();
        return;
      }

      const result: PaymentIntentResult = await lastValueFrom(this.stripeService.confirmPayment({
        elements: this.paymentElement.elements,
        redirect: 'if_required'
      }));

      if (result.error) {

        // Clear the payment session on error to allow retry
        this.store.dispatch(new CheckoutActions.UnSetSecretKey());

        // Handle specific error cases
        if (result.error.code === 'payment_intent_unexpected_state') {
          this.alert.presentSimpleAlertNavigate(
            'This payment session has already been processed or expired. Please start a new payment.',
            '/tabs/cart'
          );
        } else if (result.error.code === 'payment_intent_authentication_failure') {
          this.alert.presentSimpleAlertNavigate(
            'Payment authentication failed. Please check your payment details and try again.',
            '/tabs/cart'
          );
        } else {
          this.alert.presentSimpleAlertNavigate(
            `Payment error: ${result.error.message}`,
            '/tabs/cart'
          );
        }

        await this.closeModal();
      } else {
        try {
          const vs: any = await lastValueFrom(this.store.dispatch(new MedusaCartActions.CompleteCart()));
          if (vs.medusaCart.completed_order_id) {
            await this.closeModal();
            await this.router.navigate(
              ['/order-completed'],
              { queryParams: { orderId: vs.medusaCart.completed_order_id, payment: true } }
            );
          } else {
            this.alert.presentSimpleAlertNavigate(
              'Payment successful but order completion failed. Please contact support.',
              '/tabs/cart'
            );
            await this.closeModal();
          }
        } catch (orderError) {
          this.alert.presentSimpleAlertNavigate(
            'Payment successful but order completion failed. Please contact support with your payment confirmation.',
            '/tabs/cart'
          );
          await this.closeModal();
        }
      }
    } catch (error) {

      // Clear the payment session on any error
      this.store.dispatch(new CheckoutActions.UnSetSecretKey());

      this.alert.presentSimpleAlertNavigate(
        'An unexpected error occurred during payment. Please try again.',
        '/tabs/cart'
      );

      await this.closeModal();
    } finally {
      this.isProcessing = false;
    }
  }

  async closeModal() {
    try {
      // Reset processing state
      this.isProcessing = false;

      // Clear the payment session when modal is closed
      this.store.dispatch(new CheckoutActions.UnSetSecretKey());

      // Don't log out the user - just clear payment session
      // this.store.dispatch(new MedusaCartActions.LogOut());

      await this.modalController.dismiss();
    } catch (error) {
      await this.modalController.dismiss(null, 'cancel');
    }
  }

  async handleBackdropDismiss() {
    await this.closeModal();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
