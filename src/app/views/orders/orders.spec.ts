import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrdersView } from './orders';

const mockOrders = [
  {
    id: 1,
    orderNumber: 'ORD-TEST-1',
    status: { id: 1, code: 'requested', label: 'Requested' },
    isTentative: false,
    createdByName: 'Alexander Pierce',
    adultCount: 2,
    childCount: 1,
    currencyCode: 'JPY',
    totalFeeAmount: 12000,
    requestedAt: '2026-05-15T10:00:00',
  },
];

const mockServices = [
  {
    id: 1,
    name: 'The Drunken Tiger',
    isPrivateAvailable: true,
    isActive: true,
    area: { id: 1, code: 'TOKYO', name: 'Tokyo' },
    serviceType: { id: 1, code: 'DINING', name: 'Dining' },
  },
  {
    id: 2,
    name: 'Golden Barrel Pub',
    isPrivateAvailable: false,
    isActive: true,
    area: { id: 1, code: 'TOKYO', name: 'Tokyo' },
    serviceType: { id: 1, code: 'DINING', name: 'Dining' },
  },
];

const mockAllotments = [
  {
    id: 10,
    serviceId: 1,
    serviceDate: '2026-06-01',
    startTime: '09:00:00',
    capacityTotal: 8,
    reservedTotal: 3,
    availableTotal: 5,
    status: 'ACTIVE',
  },
  {
    id: 11,
    serviceId: 1,
    serviceDate: '2026-06-01',
    startTime: '13:00:00',
    capacityTotal: 8,
    reservedTotal: 8,
    availableTotal: 0,
    status: 'ACTIVE',
  },
];

describe('OrdersView', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersView],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(OrdersView);
    fixture.detectChanges();
    httpMock.expectOne('/api/orders').flush(mockOrders);
    httpMock.expectOne('/api/services').flush(mockServices);
    httpMock.expectOne('/api/services/areas').flush([{ id: 1, code: 'TOKYO', name: 'Tokyo' }]);
    httpMock.expectOne('/api/services/service-types').flush([{ id: 1, code: 'DINING', name: 'Dining' }]);
    httpMock.expectOne('/api/resellers').flush([]);
    httpMock.expectOne('/api/resellers/contacts').flush([]);
    httpMock.expectOne('/api/resellers/agents').flush([]);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the view', () => {
    const fixture = createFixture();
    const view = fixture.componentInstance;
    expect(view).toBeTruthy();
  });

  it('should render the orders table', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Orders');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('should open and close the new order dialog', async () => {
    const fixture = createFixture();
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
    const fixture = createFixture();
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
    expect(compiled.querySelectorAll('.service-list-row').length).toBe(2);

    const eveningButton = Array.from(compiled.querySelectorAll('.time-slot-options button')).find(
      (button) => button.textContent?.trim() === 'Evening',
    ) as HTMLButtonElement;
    eveningButton.click();
    fixture.detectChanges();

    expect(eveningButton.classList).toContain('active');
  });

  it('should load service start times for the selected date and service', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepTwoButton = compiled.querySelector('.order-stepper li:nth-child(2) button') as HTMLButtonElement;
    stepTwoButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const targetDateInput = compiled.querySelector('input[name="targetDate"]') as HTMLInputElement;
    targetDateInput.value = '2026-06-01';
    targetDateInput.dispatchEvent(new Event('input'));
    httpMock.expectOne('/api/allotments/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    const selectButton = compiled.querySelector('.service-list-row button') as HTMLButtonElement;
    selectButton.click();
    httpMock.expectOne('/api/allotments/service/1/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();
    await fixture.whenStable();

    const timeButtons = compiled.querySelectorAll('.service-time-options button');
    expect(timeButtons.length).toBe(2);
    expect(timeButtons[0].textContent).toContain('9:00AM');
    expect((timeButtons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('should filter services by the selected available time slot', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepTwoButton = compiled.querySelector('.order-stepper li:nth-child(2) button') as HTMLButtonElement;
    stepTwoButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const targetDateInput = compiled.querySelector('input[name="targetDate"]') as HTMLInputElement;
    targetDateInput.value = '2026-06-01';
    targetDateInput.dispatchEvent(new Event('input'));
    httpMock.expectOne('/api/allotments/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    const morningButton = Array.from(compiled.querySelectorAll('.time-slot-options button')).find(
      (button) => button.textContent?.trim() === 'Morning',
    ) as HTMLButtonElement;
    morningButton.click();
    fixture.detectChanges();

    const serviceRows = compiled.querySelectorAll('.service-list-row');
    expect(serviceRows.length).toBe(1);
    expect(serviceRows[0].textContent).toContain('The Drunken Tiger');
  });

  it('should show additional services on step three of the new order dialog', async () => {
    const fixture = createFixture();
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

    const handoffRadio = compiled.querySelectorAll('input[name="drop-service-type"]')[1] as HTMLInputElement;
    handoffRadio.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('The hand off location and time will be confirmed later');
    expect(compiled.querySelector('input[placeholder="Enter Hand Off Details"]')).toBeTruthy();
    expect(compiled.querySelector('input[placeholder="Enter Drop-off Location"]')).toBeFalsy();
    expect(compiled.querySelectorAll('.service-extra-card')[1].querySelector('.additional-fee')).toBeFalsy();
  });

  it('should submit hand off as a distinct additional service', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();

    const stepThreeButton = compiled.querySelector('.order-stepper li:nth-child(3) button') as HTMLButtonElement;
    stepThreeButton.click();
    fixture.detectChanges();

    const handoffRadio = compiled.querySelectorAll('input[name="drop-service-type"]')[1] as HTMLInputElement;
    handoffRadio.click();
    fixture.detectChanges();

    const handoffInput = compiled.querySelector('input[name="handoffText"]') as HTMLInputElement;
    handoffInput.value = 'Meet at the hotel lobby after confirmation';
    handoffInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const stepFourButton = compiled.querySelector('.order-stepper li:nth-child(4) button') as HTMLButtonElement;
    stepFourButton.click();
    fixture.detectChanges();

    const requestButton = compiled.querySelector('.request-order') as HTMLButtonElement;
    requestButton.click();

    const request = httpMock.expectOne('/api/orders');
    expect(request.request.body.additionalServices).toEqual([
      {
        kind: 'HANDOFF',
        isEnabled: true,
        handoffText: 'Meet at the hotel lobby after confirmation',
      },
    ]);
    request.flush(mockOrders[0]);
    httpMock.expectOne('/api/orders').flush(mockOrders);
  });

  it('should show guest details and enable request order on step four', async () => {
    const fixture = createFixture();
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
