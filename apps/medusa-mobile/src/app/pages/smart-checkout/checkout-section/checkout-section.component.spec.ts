import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutSectionComponent } from './checkout-section.component';

describe('CheckoutSectionComponent', () => {
  let component: CheckoutSectionComponent;
  let fixture: ComponentFixture<CheckoutSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Section');
    fixture.componentRef.setInput('icon', 'card-outline');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('ion-card-title');
    expect(title.textContent).toContain('Test Section');
  });

  it('should display the icon', () => {
    const compiled = fixture.nativeElement;
    const icon = compiled.querySelector('.section-title ion-icon');
    expect(icon.getAttribute('ng-reflect-name')).toBe('card-outline');
  });

  it('should show checkmark icon when completed', () => {
    fixture.componentRef.setInput('isCompleted', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const statusIcon = compiled.querySelector('.section-status ion-icon[name="checkmark-circle"]');
    expect(statusIcon).toBeTruthy();
  });

  it('should show alert icon when has error', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const statusIcon = compiled.querySelector('.section-status ion-icon[name="alert-circle"]');
    expect(statusIcon).toBeTruthy();
  });

  it('should apply completed class when isCompleted is true', () => {
    fixture.componentRef.setInput('isCompleted', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const card = compiled.querySelector('ion-card');
    expect(card.classList.contains('completed')).toBe(true);
  });

  it('should apply has-error class when hasError is true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const card = compiled.querySelector('ion-card');
    expect(card.classList.contains('has-error')).toBe(true);
  });

  it('should apply in-progress class when neither completed nor error', () => {
    fixture.componentRef.setInput('isCompleted', false);
    fixture.componentRef.setInput('hasError', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const card = compiled.querySelector('ion-card');
    expect(card.classList.contains('in-progress')).toBe(true);
  });

  it('should project content into ng-content', () => {
    const testContent = 'Test content inside section';
    const testFixture = TestBed.createComponent(CheckoutSectionComponent);
    testFixture.componentRef.setInput('title', 'Test');
    testFixture.componentRef.setInput('icon', 'card-outline');

    const compiled = testFixture.nativeElement;
    const content = compiled.querySelector('ion-card-content');
    content.innerHTML = testContent;
    testFixture.detectChanges();

    expect(content.textContent).toContain(testContent);
  });
});
