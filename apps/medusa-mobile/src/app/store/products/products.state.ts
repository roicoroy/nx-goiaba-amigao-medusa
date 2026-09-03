import { Injectable, inject } from '@angular/core';
import { State, Action, Selector, StateContext, Store } from '@ngxs/store';
import { ProductsActions } from './products.actions';
import { RegionsState } from '../regions/regions.state';
import { Observable, take, tap, throwError, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MedusaProduct, MedusaVariant, MedusaProductsResponse } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface ProductsStateModel {
  selectedProduct: MedusaProduct | any;
  selectedVariant: MedusaVariant | any;
  products: MedusaProduct[];
  selectedCategory: MedusaProduct[]; // Products filtered by category
}

@State<ProductsStateModel>({
  name: 'products',
  defaults: {
    selectedProduct: null,
    selectedVariant: null,
    selectedCategory: [],
    products: [],
  }
})
@Injectable()
export class ProductsState {
  private medusaApi = inject(MedusaService);
  private store = inject(Store);

  @Selector()
  static getProductList(state: ProductsStateModel): MedusaProduct[] {
    return state.products;
  }

  @Selector()
  static getSelectedProduct(state: ProductsStateModel): MedusaProduct {
    return state.selectedProduct;
  }

  @Selector()
  static getSelectedVariant(state: ProductsStateModel) {
    return state.selectedVariant;
  }

  @Selector()
  static getSelectedCategory(state: ProductsStateModel): MedusaProduct[] {
    return state.selectedCategory; // Products filtered by category
  }

  @Action(ProductsActions.GetProductsId)
  getProductsId(ctx: StateContext<ProductsStateModel>): Observable<any> | void {
    const defaultRegion = this.store.selectSnapshot(RegionsState.getDefaultRegion);

    if (defaultRegion?.region_id) {
      return this.medusaApi.medusaProductsList(defaultRegion.region_id).pipe(
        take(1),
        tap({
          next: (response: MedusaProductsResponse) => {
            ctx.patchState({
              products: [...response.products],
            });
          },
          error: (error) => {
            console.error('Error loading products with region:', error);
            // Fallback to basic products loading
            this.store.dispatch(new ProductsActions.GetProducts());
          }
        })
      );
    } else {
      // If no region is available, fallback to basic products loading
      this.store.dispatch(new ProductsActions.GetProducts());
    }
  }

  @Action(ProductsActions.GetProducts)
  getProducts(ctx: StateContext<ProductsStateModel>): Observable<any> {
    // Always load products when this action is called
    return this.medusaApi.productsRetrieve().pipe(
      take(1),
      tap({
        next: (response: MedusaProductsResponse) => {
          ctx.patchState({
            products: [...response.products],
          });
        },
        error: (error) => {
          console.error('Error loading products:', error);
          // Set empty array to prevent infinite loading
          ctx.patchState({
            products: [],
          });
        }
      })
    );
  }

  @Action(ProductsActions.GetSingleProduct)
  getSingleProduct(ctx: StateContext<ProductsStateModel>, { productId }: ProductsActions.GetSingleProduct): Observable<any> {
    const selectedRegion = this.store.selectSnapshot(RegionsState.getDefaultRegion);
    return this.medusaApi.showProductVariantPrice(productId, selectedRegion?.region_id).pipe(
      take(1),
      tap((response: any) => {
        ctx.patchState({
          selectedProduct: response?.product,
        });
      })
    );
  }

  @Action(ProductsActions.GetSingleProductByHandle)
  getSingleProductByHandle(ctx: StateContext<ProductsStateModel>, { handle }: ProductsActions.GetSingleProductByHandle): Observable<any> {
    if (!handle) {
      console.error('No handle provided for product lookup');
      return throwError(() => new Error('Product handle is required'));
    }

    // Get region ID - ensure we have one before proceeding
    const selectedRegion = this.store.selectSnapshot(RegionsState.getDefaultRegion);
    const regionId = selectedRegion?.region_id;

    if (!regionId) {
      console.error('No region ID available. Cannot fetch product with pricing.');
      return throwError(() => new Error('Region ID is required to fetch product'));
    }

    // Strategy: Get product by handle with all fields in a single call
    // The medusaProductsList already requests all necessary fields (*variants.*, *images.*, etc.)
    // so we don't need a second API call unless the first response is incomplete
    return this.medusaApi.medusaProductsList(regionId, { handle }).pipe(
      take(1),
      switchMap((response: any) => {
        if (!response?.products || response.products.length === 0) {
          console.error(`No products returned from API for handle "${handle}"`);
          ctx.patchState({
            selectedProduct: null,
          });
          return throwError(() => new Error(`Product with handle "${handle}" not found`));
        }

        // Find the product with matching handle (case-insensitive)
        // Also check if handle is null/undefined and use the first product if only one is returned
        let product = response.products.find((p: any) => 
          p.handle && p.handle.toLowerCase() === handle.toLowerCase()
        );

        // If handle matching fails but we got exactly one product, use it
        if (!product && response.products.length === 1) {
          product = response.products[0];
        }
        
        if (!product || !product.id) {
          console.error(`❌ Product with handle "${handle}" not found or missing ID.`);
          ctx.patchState({
            selectedProduct: null,
          });
          return throwError(() => new Error(`Product with handle "${handle}" not found`));
        }

        // IMPORTANT: Handle-based queries with fields parameter return null arrays for images/options/categories
        // The API returns: "images": [null, null, null, null] instead of actual image objects
        // This is a known Medusa API limitation - handle queries don't properly expand nested relations
        // SOLUTION: Always fetch the full product by ID to get complete data with actual image objects
        return this.medusaApi.showProductVariantPrice(product.id, regionId).pipe(
            take(1),
            tap((fullProductResponse: any) => {
              const fullProduct = fullProductResponse?.product;
              if (fullProduct) {
                ctx.patchState({
                  selectedProduct: fullProduct,
                });
              } else {
                console.error('❌ Full product response missing product data');
                // Fallback to the product we found by handle
                ctx.patchState({
                  selectedProduct: product,
                });
              }
            }),
            catchError((error: any) => {
              console.error('Error fetching full product by ID, using handle result:', error);
              // Fallback to the product we found by handle
              ctx.patchState({
                selectedProduct: product,
              });
              return of(product);
            })
          );
      }),
      catchError((error: any) => {
        console.error('Error fetching product by handle:', error);
        ctx.patchState({
          selectedProduct: null,
        });
        return throwError(() => error);
      })
    );
  }

  @Action(ProductsActions.GetCategory)
  getCategory(ctx: StateContext<ProductsStateModel>, { categoryId }: ProductsActions.GetCategory): Observable<any> {
    return this.medusaApi.getCategory(categoryId).pipe(
      take(1),
      tap((response: any) => {
        ctx.patchState({
          selectedCategory: response.products
        });
      })
    );
  }

  @Action(ProductsActions.addSelectedProduct)
  addProductToState(ctx: StateContext<ProductsStateModel>, { payload, region_id }: ProductsActions.addSelectedProduct): Observable<any> {
    return this.medusaApi.showProductVariantPrice(payload.id, region_id)
      .pipe(
        tap((response: any) => {
          ctx.patchState({
            selectedProduct: response.product,
          });
        })
      );
  }

  @Action(ProductsActions.clearSelectedProduct)
  clearProductFromState(ctx: StateContext<ProductsStateModel>): void {
    ctx.patchState({
      selectedProduct: undefined,
    });
  }

  @Action(ProductsActions.addSelectedVariant)
  addVariantToState(ctx: StateContext<ProductsStateModel>, { payload }: ProductsActions.addSelectedVariant) {
    ctx.patchState({
      selectedVariant: payload,
    });
  }

  @Action(ProductsActions.clearSelectedVariant)
  clearVariantFromState(ctx: StateContext<ProductsStateModel>) {
    ctx.patchState({
      selectedVariant: undefined,
    });
  }

  @Action(ProductsActions.ProductsLogOut)
  productsLogOut(ctx: StateContext<ProductsStateModel>) {
    ctx.patchState({
      selectedProduct: undefined,
      selectedVariant: undefined,
      products: [],
      selectedCategory: []
    });
  }
}
