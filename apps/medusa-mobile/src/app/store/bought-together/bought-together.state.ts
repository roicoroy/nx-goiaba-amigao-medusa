import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { catchError, take, throwError, of } from 'rxjs';
import { BoughtTogetherActions } from './bought-together.actions';
import { BoughtTogetherItem, MedusaProduct } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';
import { ProductsState } from '../products/products.state';
import { HttpErrorResponse } from '@angular/common/http';

export interface BoughtTogetherStateModel {
  boughtTogetherProducsts: MedusaProduct[];
  items: BoughtTogetherItem[];
  loading: boolean;
  error: string | null;
  currentProductId: string | null;
}

@State<BoughtTogetherStateModel>({
  name: 'boughtTogether',
  defaults: {
    boughtTogetherProducsts: [],
    items: [],
    loading: false,
    error: null,
    currentProductId: null
  }
})
@Injectable()
export class BoughtTogetherState {
  private medusaApi = inject(MedusaService);
  private store = inject(Store);

  @Selector()
  static getBoughtTogetherItems(state: BoughtTogetherStateModel): BoughtTogetherItem[] {
    return state?.items || [];
  }

  @Selector()
  static getLoading(state: BoughtTogetherStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: BoughtTogetherStateModel): string | null {
    return state?.error || null;
  }

  @Selector()
  static getCurrentProductId(state: BoughtTogetherStateModel): string | null {
    return state?.currentProductId || null;
  }

  @Selector()
  static getBoughtTogetherProducts(state: BoughtTogetherStateModel): MedusaProduct[] {
    return state?.boughtTogetherProducsts || [];
  }

  @Action(BoughtTogetherActions.GetBoughtTogether)
  getBoughtTogether(ctx: StateContext<BoughtTogetherStateModel>, { productId }: BoughtTogetherActions.GetBoughtTogether) {
    ctx.patchState({ loading: true, error: null, currentProductId: productId });
    this.medusaApi.getProductsBoughtTogether(productId).pipe(
      take(1),
      catchError(error => {
        // Check if this is a 404 or status 0 error (missing endpoint or CORS issue)
        const isMissingEndpoint = 
          (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 0)) ||
          (error.status === 404 || error.status === 0);
        
        if (isMissingEndpoint) {
          // For missing endpoint errors, set state with empty array (graceful failure)
          ctx.patchState({
            items: [],
            loading: false,
            error: null
          });
          // Return empty array to complete the stream gracefully
          return of([]);
        } else {
          // For other errors (500, 401, etc.), keep existing error handling
          ctx.patchState({ 
            loading: false, 
            error: error.message || error.userMessage || 'Failed to load bought together products' 
          });
          return throwError(() => error);
        }
      })
    ).subscribe((items: BoughtTogetherItem[]) => {
      ctx.patchState({
        items: items || [],
        loading: false
      });
      // After items are loaded, filter products
      ctx.dispatch(new BoughtTogetherActions.FilterBoughtTogetherProducts());
    });
  }

  @Action(BoughtTogetherActions.FilterBoughtTogetherProducts)
  filterBoughtTogetherProducts(ctx: StateContext<BoughtTogetherStateModel>) {
    const state = ctx.getState();
    const items = state.items;
    const products = this.store.selectSnapshot(ProductsState.getProductList);

    if (!items || items.length === 0 || !products || products.length === 0) {
      ctx.patchState({
        boughtTogetherProducsts: []
      });
      return;
    }

    // Extract unique product IDs from items (both productId1 and productId2)
    const productIds = [...new Set([
      ...items.map(item => item.productId1),
      ...items.map(item => item.productId2)
    ])];

    // Filter products that match the productId1 and productId2 values
    const boughtTogetherProducts = products.filter(product => 
      productIds.includes(product.id)
    );

    ctx.patchState({
      boughtTogetherProducsts: boughtTogetherProducts
    });
  }
}

