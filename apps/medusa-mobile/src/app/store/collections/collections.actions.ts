import { MedusaCollection } from "../../shared/interfaces/medusa-collection.interface";

export namespace CollectionsActions {
  export class GetCollections {
    public static readonly type = '[CollectionsState] Get Collections';
    constructor(public readonly queryParams?: any) {}
  }

  export class GetCollectionById {
    public static readonly type = '[CollectionsState] Get Collection By Id';
    constructor(public readonly collectionId: string, public readonly queryParams?: any) {}
  }

  export class GetCollectionProducts {
    public static readonly type = '[CollectionsState] Get Collection Products';
    constructor(public readonly collectionId: string, public readonly queryParams?: any) {}
  }

  export class SetSelectedCollection {
    public static readonly type = '[CollectionsState] Set Selected Collection';
    constructor(public readonly collection: MedusaCollection | null) {}
  }

  export class ClearSelectedCollection {
    public static readonly type = '[CollectionsState] Clear Selected Collection';
  }
}

