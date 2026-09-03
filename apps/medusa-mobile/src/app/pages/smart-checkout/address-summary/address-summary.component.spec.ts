import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressSummaryComponent } from './address-summary.component';
import { MedusaAddress } from 'src/app/shared/interfaces/medusa-address.interface';

describe('AddressSummaryComponent', () => {
  let component: AddressSummaryComponent;
  let fixture: ComponentFixture<AddressSummaryComponent>;

  const mockAddress: MedusaAddress = {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    address_2: 'Apt 4B',
    city: 'New York',
    province: 'NY',
    postal_code: '10001',
    country_code: 'US',
    phone: '+1234567890',
    company: 'Test Company',
    is_default_shipping: true,
    is_default_billing: false,
    country: {
      display_name: 'United States'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressSummaryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('address', mockAddress);
    fixture.componentRef.setInput('addressType', 'shipping');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display full name correctly', () => {
    expect(component.getFullName()).toBe('John Doe');
  });

  it('should display country name from country object', () => {
    expect(component.getCountryName()).toBe('United States');
  });

  it('should display country code when country object is not available', () => {
    const addressWithoutCountry: MedusaAddress = {
      ...mockAddress,
      country: undefined
    };
    fixture.componentRef.setInput('address', addressWithoutCountry);
    fixture.detectChanges();
    expect(component.getCountryName()).toBe('US');
  });

  it('should format address lines correctly', () => {
    const lines = component.getAddressLines();
    expect(lines).toContain('123 Main St');
    expect(lines).toContain('Apt 4B');
    expect(lines).toContain('New York, NY, 10001');
    expect(lines).toContain('United States');
  });

  it('should identify default shipping address', () => {
    fixture.componentRef.setInput('addressType', 'shipping');
    fixture.detectChanges();
    expect(component.isDefaultAddress()).toBe(true);
  });

  it('should identify default billing address', () => {
    const billingAddress: MedusaAddress = {
      ...mockAddress,
      is_default_shipping: false,
      is_default_billing: true
    };
    fixture.componentRef.setInput('address', billingAddress);
    fixture.componentRef.setInput('addressType', 'billing');
    fixture.detectChanges();
    expect(component.isDefaultAddress()).toBe(true);
  });

  it('should emit edit event when edit button is clicked', () => {
    const editSpy = jasmine.createSpy('edit');
    component.edit.subscribe(editSpy);

    component.onEdit();

    expect(editSpy).toHaveBeenCalled();
  });

  it('should emit select event when select button is clicked', () => {
    const selectSpy = jasmine.createSpy('select');
    component.select.subscribe(selectSpy);

    component.onSelect();

    expect(selectSpy).toHaveBeenCalled();
  });

  it('should return phone number', () => {
    expect(component.getPhone()).toBe('+1234567890');
  });

  it('should return company name', () => {
    expect(component.getCompany()).toBe('Test Company');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalAddress: MedusaAddress = {
      first_name: 'Jane',
      last_name: 'Smith',
      address_1: '456 Oak Ave',
      city: 'Boston',
      postal_code: '02101',
      country_code: 'US'
    };
    fixture.componentRef.setInput('address', minimalAddress);
    fixture.detectChanges();

    expect(component.getFullName()).toBe('Jane Smith');
    expect(component.getCompany()).toBe('');
    expect(component.getPhone()).toBe('');
    expect(component.getAddressLines().length).toBeGreaterThan(0);
  });
});
