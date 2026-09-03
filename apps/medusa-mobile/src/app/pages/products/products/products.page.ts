import { Component, OnDestroy, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonText
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

import { GoiabaHeaderComponent } from 'src/app/components/goiaba-components/goiaba-header/goiaba-header.component';
import { ProductListComponent, ProductCategoriesComponent } from './products-components';
import { ProductCollectionComponent } from './product-collection/product-collection.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    ProductCollectionComponent,
    ProductListComponent,
    ProductCategoriesComponent,
    GoiabaHeaderComponent,
  ]
})
export class ProductsPage implements OnDestroy {
  private readonly ngUnsubscribe = new Subject();
  private router = inject(Router);

  constructor() {

  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
