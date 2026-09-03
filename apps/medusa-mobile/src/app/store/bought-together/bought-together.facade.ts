import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BoughtTogetherState } from './bought-together.state';
import { BoughtTogetherActions } from './bought-together.actions';
import { BoughtTogetherItem, MedusaProduct } from '../../shared/interfaces';

export interface IBoughtTogetherFacadeState {
  items: BoughtTogetherItem[];
  products: MedusaProduct[];
  loading: boolean;
  error: string | null;
  currentProductId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BoughtTogetherFacade {
  private store = inject(Store);

  // Individual observables
  items$: Observable<BoughtTogetherItem[]> = this.store.select(BoughtTogetherState.getBoughtTogetherItems);
  products$: Observable<MedusaProduct[]> = this.store.select(BoughtTogetherState.getBoughtTogetherProducts);
  loading$: Observable<boolean> = this.store.select(BoughtTogetherState.getLoading);
  error$: Observable<string | null> = this.store.select(BoughtTogetherState.getError);
  currentProductId$: Observable<string | null> = this.store.select(BoughtTogetherState.getCurrentProductId);

  // Combined viewState
  readonly viewState$: Observable<IBoughtTogetherFacadeState>;

  constructor() {
    this.viewState$ = combineLatest([
      this.items$,
      this.products$,
      this.loading$,
      this.error$,
      this.currentProductId$
    ]).pipe(
      map(([items, products, loading, error, currentProductId]) => ({
        items,
        products,
        loading,
        error,
        currentProductId
      }))
    );
  }

  // Actions
  loadBoughtTogether(productId: string): void {
    this.store.dispatch(new BoughtTogetherActions.GetBoughtTogether(productId));
  }

  // Selectors (snapshot helpers)
  getItemsSnapshot(): BoughtTogetherItem[] {
    return this.store.selectSnapshot(BoughtTogetherState.getBoughtTogetherItems);
  }

  getLoadingSnapshot(): boolean {
    return this.store.selectSnapshot(BoughtTogetherState.getLoading);
  }

  getErrorSnapshot(): string | null {
    return this.store.selectSnapshot(BoughtTogetherState.getError);
  }

  getCurrentProductIdSnapshot(): string | null {
    return this.store.selectSnapshot(BoughtTogetherState.getCurrentProductId);
  }

  getProductsSnapshot(): MedusaProduct[] {
    return this.store.selectSnapshot(BoughtTogetherState.getBoughtTogetherProducts);
  }
}

