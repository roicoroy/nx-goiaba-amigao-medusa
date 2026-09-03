import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialLoginCallbackPage } from './social-login-callback.page';

describe('SocialLoginCallbackPage', () => {
  let component: SocialLoginCallbackPage;
  let fixture: ComponentFixture<SocialLoginCallbackPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialLoginCallbackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
