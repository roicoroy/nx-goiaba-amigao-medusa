import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import { IonSpinner } from '@ionic/angular/standalone';

import { BoughtTogetherFacade, IBoughtTogetherFacadeState } from 'src/app/store/bought-together/bought-together.facade';
import { GoiabaCardComponent } from 'src/app/components/goiaba-components';
import { MedusaProduct } from 'src/app/shared/interfaces';
import { RegionsState } from 'src/app/store/regions/regions.state';

@Component({
  selector: 'app-bought-together',
  templateUrl: './bought-together.component.html',
  styleUrls: ['./bought-together.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner,
    GoiabaCardComponent
  ]
})
export class BoughtTogetherComponent implements OnInit {
  @Input() productId!: string;

  viewState$!: Observable<IBoughtTogetherFacadeState>;
  private facade = inject(BoughtTogetherFacade);
  private router = inject(Router);
  private store = inject(Store);

  ngOnInit() {
    if (this.productId) {
      this.facade.loadBoughtTogether(this.productId);
      this.viewState$ = this.facade.viewState$;
    }
  }

  detailsPage(product: MedusaProduct) {
    if (product.id) {
    //   const regionId = this.store.selectSnapshot(RegionsState.getDefaultRegion)?.region_id;
    //   const queryParams: any = {};
    //   if (regionId) {
    //     queryParams.region_id = regionId;
    //   }
    //   this.router.navigate(['/products', product.id], { queryParams });
    }
  }
}
