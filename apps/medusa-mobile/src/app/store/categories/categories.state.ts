import { Injectable, inject } from '@angular/core';
import { State, Action, Selector, StateContext } from '@ngxs/store';
import { CategoriesActions } from './categories.actions';
import { Observable, take, tap } from 'rxjs';
import { MedusaCategory, MedusaProductsCategoriesResponse } from 'src/app/shared/interfaces';
import { MedusaService } from 'src/app/shared/api/medusa.service';

export interface CategoriesStateModel {
  categories: MedusaCategory[];
  selectedCategory: MedusaCategory | null;
  loading: boolean;
  error: string | null;
}

@State<CategoriesStateModel>({
  name: 'categories',
  defaults: {
    categories: [],
    selectedCategory: null,
    loading: false,
    error: null,
  }
})
@Injectable()
export class CategoriesState {
  private medusaApi = inject(MedusaService);

  @Selector()
  static getCategories(state: CategoriesStateModel): MedusaCategory[] {
    return state.categories;
  }

  @Selector()
  static getSelectedCategory(state: CategoriesStateModel): MedusaCategory | null {
    return state.selectedCategory;
  }

  @Selector()
  static getCategoriesLoading(state: CategoriesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static getCategoriesError(state: CategoriesStateModel): string | null {
    return state.error;
  }

  @Action(CategoriesActions.GetCategories)
  getCategories(ctx: StateContext<CategoriesStateModel>, { queryParams }: CategoriesActions.GetCategories): Observable<any> | void {
    const state = ctx.getState();
    
    // Only fetch if we don't have categories or if queryParams are provided
    if (state.categories.length === 0 || queryParams) {
      ctx.patchState({ loading: true, error: null });
      
      return this.medusaApi.getCategories(queryParams).pipe(
        take(1),
        tap({
          next: (response: MedusaProductsCategoriesResponse) => {
            ctx.patchState({
              categories: [...response.product_categories],
              loading: false,
              error: null,
            });
          },
          error: (error) => {
            console.error('Error loading categories:', error);
            ctx.patchState({
              loading: false,
              error: error?.userMessage || 'Failed to load categories',
            });
          }
        })
      );
    }
  }

  @Action(CategoriesActions.GetCategoryWithDetails)
  getCategoryWithDetails(ctx: StateContext<CategoriesStateModel>, { categoryId, includeChildren }: CategoriesActions.GetCategoryWithDetails): Observable<any> {
    ctx.patchState({ loading: true, error: null });
    
    return this.medusaApi.getCategoryWithDetails(categoryId, includeChildren).pipe(
      take(1),
      tap({
        next: (response: { product_category: MedusaCategory }) => {
          ctx.patchState({
            selectedCategory: response.product_category,
            loading: false,
            error: null,
          });
        },
        error: (error) => {
          console.error('Error loading category details:', error);
          ctx.patchState({
            loading: false,
            error: error?.userMessage || 'Failed to load category details',
          });
        }
      })
    );
  }

  @Action(CategoriesActions.SetSelectedCategory)
  setSelectedCategory(ctx: StateContext<CategoriesStateModel>, { category }: CategoriesActions.SetSelectedCategory): void {
    ctx.patchState({
      selectedCategory: category,
    });
  }

  @Action(CategoriesActions.ClearSelectedCategory)
  clearSelectedCategory(ctx: StateContext<CategoriesStateModel>): void {
    ctx.patchState({
      selectedCategory: null,
    });
  }
}

