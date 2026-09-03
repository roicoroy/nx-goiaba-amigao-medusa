import { MedusaCategory } from "../../shared/interfaces/medusa-categories.interface";

export namespace CategoriesActions {
  export class GetCategories {
    public static readonly type = '[CategoriesState] Get Categories';
    constructor(public readonly queryParams?: any) {}
  }

  export class GetCategory {
    public static readonly type = '[CategoriesState] Get Category';
    constructor(public readonly categoryId: string) {}
  }

  export class GetCategoryWithDetails {
    public static readonly type = '[CategoriesState] Get Category With Details';
    constructor(
      public readonly categoryId: string,
      public readonly includeChildren: boolean = false
    ) {}
  }

  export class ClearSelectedCategory {
    public static readonly type = '[CategoriesState] Clear Selected Category';
  }

  export class SetSelectedCategory {
    public static readonly type = '[CategoriesState] Set Selected Category';
    constructor(public readonly category: MedusaCategory | null) {}
  }
}

