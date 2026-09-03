export namespace FCMActions {
  export class Initialize {
    static readonly type = '[FCM] Initialize';
    constructor(public customerId?: string) { }
  }

  export class RegisterToken {
    static readonly type = '[FCM] Register Token';
    constructor(public token: string, public customerId?: string) { }
  }

  export class UnregisterToken {
    static readonly type = '[FCM] Unregister Token';
    constructor(public token?: string) { }
  }

  export class SetToken {
    static readonly type = '[FCM] Set Token';
    constructor(public token: string | null) { }
  }

  export class SetRegistered {
    static readonly type = '[FCM] Set Registered';
    constructor(public registered: boolean) { }
  }

  export class SetError {
    static readonly type = '[FCM] Set Error';
    constructor(public error: string | null) { }
  }

  export class ClearFCM {
    static readonly type = '[FCM] Clear FCM';
  }
}

