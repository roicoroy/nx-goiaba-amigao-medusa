import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { FCMActions } from './fcm.actions';
import { FCMService } from 'src/app/shared/services/fcm.service';

export interface FCMStateModel {
  token: string | null;
  registered: boolean;
  loading: boolean;
  error: string | null;
}

@State<FCMStateModel>({
  name: 'fcm',
  defaults: {
    token: null,
    registered: false,
    loading: false,
    error: null
  }
})
@Injectable()
export class FCMState {
  private fcmService = inject(FCMService);

  @Selector()
  static getToken(state: FCMStateModel): string | null {
    return state?.token || null;
  }

  @Selector()
  static isRegistered(state: FCMStateModel): boolean {
    return state?.registered || false;
  }

  @Selector()
  static getLoading(state: FCMStateModel): boolean {
    return state?.loading || false;
  }

  @Selector()
  static getError(state: FCMStateModel): string | null {
    return state?.error || null;
  }

  @Action(FCMActions.Initialize)
  async initialize(ctx: StateContext<FCMStateModel>, { customerId }: FCMActions.Initialize) {
    ctx.patchState({ loading: true, error: null });
    try {
      await this.fcmService.initialize(customerId);
      const token = this.fcmService.getCurrentToken();
      ctx.patchState({
        token,
        registered: !!token,
        loading: false
      });
    } catch (error: any) {
      ctx.patchState({
        loading: false,
        error: error?.message || 'Failed to initialize FCM'
      });
    }
  }

  @Action(FCMActions.RegisterToken)
  async registerToken(ctx: StateContext<FCMStateModel>, { token, customerId }: FCMActions.RegisterToken) {
    ctx.patchState({ loading: true, error: null });
    try {
      await this.fcmService.registerToken(token, customerId);
      console.log('FCM token registered@@@@', token);
      ctx.patchState({
        token,
        registered: true,
        loading: false
      });
    } catch (error: any) {
      ctx.patchState({
        loading: false,
        error: error?.message || 'Failed to register FCM token'
      });
    }
  }

  @Action(FCMActions.UnregisterToken)
  async unregisterToken(ctx: StateContext<FCMStateModel>, { token }: FCMActions.UnregisterToken) {
    ctx.patchState({ loading: true, error: null });
    try {
      await this.fcmService.unregisterToken(token);
      ctx.patchState({
        token: null,
        registered: false,
        loading: false
      });
    } catch (error: any) {
      ctx.patchState({
        loading: false,
        error: error?.message || 'Failed to unregister FCM token'
      });
    }
  }

  @Action(FCMActions.SetToken)
  setToken(ctx: StateContext<FCMStateModel>, { token }: FCMActions.SetToken) {
    ctx.patchState({ token });
  }

  @Action(FCMActions.SetRegistered)
  setRegistered(ctx: StateContext<FCMStateModel>, { registered }: FCMActions.SetRegistered) {
    ctx.patchState({ registered });
  }

  @Action(FCMActions.SetError)
  setError(ctx: StateContext<FCMStateModel>, { error }: FCMActions.SetError) {
    ctx.patchState({ error });
  }

  @Action(FCMActions.ClearFCM)
  clearFCM(ctx: StateContext<FCMStateModel>) {
    ctx.patchState({
      token: null,
      registered: false,
      error: null
    });
  }
}

