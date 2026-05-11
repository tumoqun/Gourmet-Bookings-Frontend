import { TestBed } from '@angular/core/testing';
import { OrdersView } from './orders';

describe('OrdersView', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersView],
    }).compileComponents();
  });

  it('should create the view', () => {
    const fixture = TestBed.createComponent(OrdersView);
    const view = fixture.componentInstance;
    expect(view).toBeTruthy();
  });

  it('should render the orders table', async () => {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Orders');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('should open and close the new order dialog', async () => {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="dialog"]')).toBeFalsy();

    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[role="dialog"] h2')?.textContent).toContain('New Order');

    const cancelButton = compiled.querySelector('.cancel-order') as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('should show service details on step two of the new order dialog', async () => {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepTwoButton = compiled.querySelector('.order-stepper li:nth-child(2) button') as HTMLButtonElement;
    stepTwoButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('#service-details-title')?.textContent).toContain('Service Details');
    expect(compiled.querySelectorAll('.service-list-row').length).toBe(5);

    const eveningButton = Array.from(compiled.querySelectorAll('.time-slot-options button')).find(
      (button) => button.textContent?.trim() === 'Evening',
    ) as HTMLButtonElement;
    eveningButton.click();
    fixture.detectChanges();

    expect(eveningButton.classList).toContain('active');
  });

  it('should show additional services on step three of the new order dialog', async () => {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepThreeButton = compiled.querySelector('.order-stepper li:nth-child(3) button') as HTMLButtonElement;
    stepThreeButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('#additional-services-title')?.textContent).toContain('Additional Services');
    expect(compiled.querySelector('input[placeholder="Enter Voucher Number"]')).toBeTruthy();
    expect(compiled.querySelectorAll('.service-extra-card').length).toBe(2);
    expect(compiled.querySelectorAll('.additional-fee').length).toBe(2);
  });

  it('should show guest details and enable request order on step four', async () => {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepFourButton = compiled.querySelector('.order-stepper li:nth-child(4) button') as HTMLButtonElement;
    stepFourButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('#guest-details-title')?.textContent).toContain('Guest Details');
    expect(compiled.querySelector('input[placeholder="Enter Email"]')).toBeTruthy();
    expect(compiled.querySelectorAll('.guest-counter').length).toBe(2);
    expect(compiled.querySelectorAll('.special-request-chips span').length).toBe(2);

    const requestButton = compiled.querySelector('.request-order') as HTMLButtonElement;
    expect(requestButton.disabled).toBe(false);

    const increaseAdultsButton = compiled.querySelector('[aria-label="Increase adults"]') as HTMLButtonElement;
    increaseAdultsButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.guest-counter strong')?.textContent?.trim()).toBe('03');
  });
});
