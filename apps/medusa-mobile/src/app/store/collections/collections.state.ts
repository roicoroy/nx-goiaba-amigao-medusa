import { Injectable, inject } from '@angular/core';
import { State, Action, Selector, StateContext } from '@ngxs/store';
import { CollectionsActions } from './collections.actions';
import { Observable, take, tap } from 'rxjs';
import { MedusaCollection, MedusaCollectionsResponse, MedusaProduct, MedusaProductsResponse } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface CollectionsStateModel {
  collections: MedusaCollection[];
  selectedCollection: MedusaCollection | null;
  selectedCollectionProducts: MedusaProduct[];
  loading: boolean;
  error: string | null;
}

@State<CollectionsStateModel>({
  name: 'collections',
  defaults: {
    collections: [],
    selectedCollection: null,
    selectedCollectionProducts: [],
    loading: false,
    error: null,
  }
})
@Injectable()
export class CollectionsState {
  private medusaApi = inject(MedusaService);

  @Selector()
  static getCollections(state: CollectionsStateModel): MedusaCollection[] {
    return state.collections;
  }

  @Selector()
  static getSelectedCollection(state: CollectionsStateModel): MedusaCollection | null {
    return state.selectedCollection;
  }

  @Selector()
  static getCollectionsLoading(state: CollectionsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getCollectionsError(state: CollectionsStateModel): string | null {
    return state.error;
  }

  @Selector()
  static getSelectedCollectionProducts(state: CollectionsStateModel): MedusaProduct[] {
    return state.selectedCollectionProducts;
  }

  @Action(CollectionsActions.GetCollections)
  getCollections(ctx: StateContext<CollectionsStateModel>, { queryParams }: CollectionsActions.GetCollections): Observable<any> | void {
    const state = ctx.getState();
    
    // Only fetch if we don't have collections or if queryParams are provided
    if (state.collections.length === 0 || queryParams) {
      ctx.patchState({ loading: true, error: null });
      
      return this.medusaApi.getCollections(queryParams).pipe(
        take(1),
        tap({
          next: (response: MedusaCollectionsResponse) => {
            ctx.patchState({
              collections: [...response.collections],
              loading: false,
              error: null,
            });
          },
          error: (error) => {
            console.error('[CollectionsState] GetCollections - Error loading collections:', error);
            console.error('[CollectionsState] GetCollections - Error details:', {
              message: error?.message,
              userMessage: error?.userMessage,
              status: error?.status,
              error
            });
            ctx.patchState({
              loading: false,
              error: error?.userMessage || 'Failed to load collections',
            });
          }
        })
      );
    }
  }

  @Action(CollectionsActions.GetCollectionById)
  getCollectionById(ctx: StateContext<CollectionsStateModel>, { collectionId, queryParams }: CollectionsActions.GetCollectionById): Observable<any> {
    ctx.patchState({ loading: true, error: null });
    
    return this.medusaApi.getCollectionById(collectionId, queryParams).pipe(
      take(1),
      tap({
        next: (response: { collection: MedusaCollection }) => {
          ctx.patchState({
            selectedCollection: response.collection,
            loading: false,
            error: null,
          });
        },
        error: (error) => {
          console.error('Error loading collection details:', error);
          ctx.patchState({
            loading: false,
            error: error?.userMessage || 'Failed to load collection details',
          });
        }
      })
    );
  }

  @Action(CollectionsActions.GetCollectionProducts)
  getCollectionProducts(ctx: StateContext<CollectionsStateModel>, { collectionId, queryParams }: CollectionsActions.GetCollectionProducts): Observable<any> {
    ctx.patchState({ loading: true, error: null });
    
    return this.medusaApi.getCollectionProducts(collectionId, queryParams).pipe(
      take(1),
      tap({
        next: (response: MedusaProductsResponse) => {
          // Find the collection and update it with products
          const state = ctx.getState();
          const collection = state.collections.find(c => c.id === collectionId);
          
          if (collection) {
            const updatedCollection: MedusaCollection = {
              ...collection,
              products: response.products
            };
            
            ctx.patchState({
              selectedCollection: updatedCollection,
              selectedCollectionProducts: response.products || [],
              loading: false,
              error: null,
            });
          } else {
            ctx.patchState({
              selectedCollectionProducts: response.products || [],
              loading: false,
              error: null,
            });
          }
        },
        error: (error) => {
          console.error('[CollectionsState] GetCollectionProducts - Error:', error);
          ctx.patchState({
            loading: false,
            error: error?.userMessage || 'Failed to load collection products',
          });
        }
      })
    );
  }

  @Action(CollectionsActions.SetSelectedCollection)
  setSelectedCollection(ctx: StateContext<CollectionsStateModel>, { collection }: CollectionsActions.SetSelectedCollection): void {
    ctx.patchState({
      selectedCollection: collection,
    });
  }

  @Action(CollectionsActions.ClearSelectedCollection)
  clearSelectedCollection(ctx: StateContext<CollectionsStateModel>): void {
    ctx.patchState({
      selectedCollection: null,
    });
  }
}

