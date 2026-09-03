import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionsState } from './collections.state';
import { CollectionsActions } from './collections.actions';
import { MedusaCollection, MedusaProduct } from '../../shared/interfaces';

export interface ICollectionsFacadeState {
  collections: MedusaCollection[];
  selectedCollection: MedusaCollection | null;
  selectedCollectionProducts: MedusaProduct[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsFacade {
  private store = inject(Store);

  // Individual observables
  collections$: Observable<MedusaCollection[]> = this.store.select(CollectionsState.getCollections);
  selectedCollection$: Observable<MedusaCollection | null> = this.store.select(CollectionsState.getSelectedCollection);
  selectedCollectionProducts$: Observable<MedusaProduct[]> = this.store.select(CollectionsState.getSelectedCollectionProducts);
  loading$: Observable<boolean> = this.store.select(CollectionsState.getCollectionsLoading);
  error$: Observable<string | null> = this.store.select(CollectionsState.getCollectionsError);

  // Combined viewState
  readonly viewState$: Observable<ICollectionsFacadeState>;

  constructor() {
    this.viewState$ = combineLatest([
      this.collections$,
      this.selectedCollection$,
      this.selectedCollectionProducts$,
      this.loading$,
      this.error$
    ]).pipe(
      map(([collections, selectedCollection, selectedCollectionProducts, loading, error]) => ({
        collections,
        selectedCollection,
        selectedCollectionProducts,
        loading,
        error
      }))
    );
  }

  // Actions
  loadCollections(queryParams?: any): void {
    this.store.dispatch(new CollectionsActions.GetCollections(queryParams));
  }

  loadCollectionById(collectionId: string, queryParams?: any): void {
    this.store.dispatch(new CollectionsActions.GetCollectionById(collectionId, queryParams));
  }

  loadCollectionProducts(collectionId: string, queryParams?: any): void {
    this.store.dispatch(new CollectionsActions.GetCollectionProducts(collectionId, queryParams));
  }

  setSelectedCollection(collection: MedusaCollection | null): void {
    this.store.dispatch(new CollectionsActions.SetSelectedCollection(collection));
  }

  clearSelectedCollection(): void {
    this.store.dispatch(new CollectionsActions.ClearSelectedCollection());
  }

  // Selectors (snapshot helpers)
  getCollectionsSnapshot(): MedusaCollection[] {
    return this.store.selectSnapshot(CollectionsState.getCollections);
  }

  getSelectedCollectionSnapshot(): MedusaCollection | null {
    return this.store.selectSnapshot(CollectionsState.getSelectedCollection);
  }

  getLoadingSnapshot(): boolean {
    return this.store.selectSnapshot(CollectionsState.getCollectionsLoading);
  }

  getErrorSnapshot(): string | null {
    return this.store.selectSnapshot(CollectionsState.getCollectionsError);
  }

  getSelectedCollectionProductsSnapshot(): MedusaProduct[] {
    return this.store.selectSnapshot(CollectionsState.getSelectedCollectionProducts);
  }
}

