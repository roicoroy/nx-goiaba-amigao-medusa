import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCompletedPage } from './order-completed.page';

describe('OrderCompletedPage', () => {
  let component: OrderCompletedPage;
  let fixture: ComponentFixture<OrderCompletedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderCompletedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
