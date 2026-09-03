import { AuthenticationStateModel } from './auth.state';

export class Login {
  static readonly type = '[Auth] Login';
  constructor(readonly payload: { email: string; password: string }) {}
}

export class LoginSuccess {
  static readonly type = '[Auth] Login Success';
  constructor(readonly payload: { user: any; token: string }) {}
}

export class LoginFailure {
  static readonly type = '[Auth] Login Failure';
  constructor(readonly payload: { error: string }) {}
}

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class SetAuthData {
  static readonly type = '[Auth] Set Auth Data';
  constructor(readonly payload: AuthenticationStateModel) {}
}

export class CheckAuthStatus {
  static readonly type = '[Auth] Check Auth Status';
}

export class Register {
  static readonly type = '[Auth] Register';
  constructor(readonly payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {}
}
