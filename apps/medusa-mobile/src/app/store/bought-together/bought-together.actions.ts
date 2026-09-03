export namespace BoughtTogetherActions {
  export class GetBoughtTogether {
    static readonly type = '[BoughtTogetherState] Get Bought Together';
    constructor(public productId: string) { }
  }

  export class FilterBoughtTogetherProducts {
    static readonly type = '[BoughtTogetherState] Filter Bought Together Products';
  }
}

