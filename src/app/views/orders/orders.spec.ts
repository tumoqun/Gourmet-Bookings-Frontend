import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { OrdersView } from './orders';

environment.apiUrl = '/api';

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

const mockReseller = { id: 1, name: 'Gourmet Travel', status: 'ACTIVE' };
const mockContact = {
  id: 1,
  reseller: mockReseller,
  name: 'Mina Sato',
  email: 'mina@example.com',
  isPrimary: true,
};
const mockAgent = {
  id: 1,
  reseller: mockReseller,
  name: 'Yuki Tanaka',
  email: 'yuki@example.com',
};
const mockDistanceBands = [
  { id: 1, label: '<5km', sortOrder: 1, feeAmount: 1500 },
  { id: 2, label: '5-10km', sortOrder: 2, feeAmount: 3000 },
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
    httpMock.expectOne('/api/services/distance-bands').flush(mockDistanceBands);
    httpMock.expectOne('/api/resellers').flush([mockReseller]);
    httpMock.expectOne('/api/resellers/contacts').flush([mockContact]);
    httpMock.expectOne('/api/resellers/agents').flush([mockAgent]);
    httpMock.expectOne('/api/special-requests').flush([
      { id: 1, code: 'VIP', label: 'VIP' },
      { id: 2, code: 'BAG', label: 'Baggage' }
    ]);
    fixture.detectChanges();
    return fixture;
  }

  function openNewOrderDialog(fixture: ReturnType<typeof createFixture>) {
    const compiled = fixture.nativeElement as HTMLElement;
    const newBookingButton = compiled.querySelector('.new-booking') as HTMLButtonElement;
    newBookingButton.click();
    fixture.detectChanges();
    return compiled;
  }

  function openActionMenu(fixture: ReturnType<typeof createFixture>) {
    const compiled = fixture.nativeElement as HTMLElement;
    const moreActionButton = compiled.querySelector('.more-action') as HTMLButtonElement;
    moreActionButton.click();
    fixture.detectChanges();
    return compiled;
  }

  function setInputValue(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function getDialog(compiled: HTMLElement) {
    return compiled.querySelector('.new-order-dialog') as HTMLElement;
  }

  function selectOptionByText(select: HTMLSelectElement, text: string) {
    const index = Array.from(select.options).findIndex((option) => option.textContent?.trim() === text);
    expect(index).toBeGreaterThan(-1);
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change'));
  }

  function clickPrimaryAction(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const requestButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    requestButton.click();
    fixture.detectChanges();
    return requestButton;
  }

  function fillStepOne(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const dialog = getDialog(compiled);
    setInputValue(dialog.querySelector('input[placeholder="Enter Name"]') as HTMLInputElement, 'Alexander Pierce');
    selectOptionByText(dialog.querySelector('#new-order-reseller') as HTMLSelectElement, mockReseller.name);
    fixture.detectChanges();
    selectOptionByText(dialog.querySelector('#new-order-agent') as HTMLSelectElement, mockAgent.name);
    selectOptionByText(dialog.querySelector('select:not(#new-order-reseller):not(#new-order-agent)') as HTMLSelectElement, mockContact.name);
    setInputValue(dialog.querySelector('input[type="email"][placeholder="Enter Email"]') as HTMLInputElement, mockContact.email);
    setInputValue(dialog.querySelectorAll('input[type="email"][placeholder="Enter Email"]')[1] as HTMLInputElement, 'copy@example.com');
    setInputValue(dialog.querySelectorAll('input[placeholder="Enter Reference Number"]')[0] as HTMLInputElement, 'REF-1');
    setInputValue(dialog.querySelectorAll('input[placeholder="Enter Reference Number"]')[1] as HTMLInputElement, 'REF-2');
    fixture.detectChanges();
  }

  function goToStepTwo(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    fillStepOne(compiled, fixture);
    clickPrimaryAction(compiled, fixture);
  }

  function fillStepTwo(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const dialog = getDialog(compiled);
    const targetDateInput = dialog.querySelector('input[name="targetDate"]') as HTMLInputElement;
    setInputValue(targetDateInput, '2026-06-01');
    httpMock.expectOne('/api/allotments/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    selectOptionByText(dialog.querySelector('select[name="selectedAreaId"]') as HTMLSelectElement, 'Tokyo');
    selectOptionByText(dialog.querySelector('select[name="selectedServiceTypeId"]') as HTMLSelectElement, 'Dining');
    fixture.detectChanges();

    const selectButton = dialog.querySelector('.service-list-row button') as HTMLButtonElement;
    selectButton.click();
    httpMock.expectOne('/api/allotments/service/1/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    const timeButton = dialog.querySelector('.service-time-options button:not(:disabled)') as HTMLButtonElement;
    timeButton.click();
    fixture.detectChanges();
  }

  function goToStepThree(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    goToStepTwo(compiled, fixture);
    fillStepTwo(compiled, fixture);
    clickPrimaryAction(compiled, fixture);
  }

  it('should prevent selecting past dates in step two', () => {
    const fixture = createFixture();
    const compiled = openNewOrderDialog(fixture);
    goToStepTwo(compiled, fixture);

    const targetDateInput = getDialog(compiled).querySelector('input[name="targetDate"]') as HTMLInputElement;
    const expectedMinDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    expect(targetDateInput.getAttribute('min')).toBe(expectedMinDate);
  });

  it('should allow advancing step one without selecting an original agent', () => {
    const fixture = createFixture();
    const compiled = openNewOrderDialog(fixture);

    const dialog = getDialog(compiled);
    setInputValue(dialog.querySelector('input[placeholder="Enter Name"]') as HTMLInputElement, 'Alexander Pierce');
    selectOptionByText(dialog.querySelector('#new-order-reseller') as HTMLSelectElement, mockReseller.name);
    fixture.detectChanges();
    selectOptionByText(dialog.querySelector('select:not(#new-order-reseller):not(#new-order-agent)') as HTMLSelectElement, mockContact.name);
    setInputValue(dialog.querySelector('input[type="email"][placeholder="Enter Email"]') as HTMLInputElement, mockContact.email);
    setInputValue(dialog.querySelectorAll('input[placeholder="Enter Reference Number"]')[0] as HTMLInputElement, 'REF-1');
    fixture.detectChanges();

    clickPrimaryAction(compiled, fixture);

    expect(getDialog(compiled).querySelector('.order-details-heading')?.textContent).toContain('Service Details');
  });

  function fillStepThreeDropoff(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const dialog = getDialog(compiled);
    setInputValue(dialog.querySelector('input[name="voucherNumber"]') as HTMLInputElement, 'VOUCH-1');
    setInputValue(dialog.querySelector('input[name="pickupLocation"]') as HTMLInputElement, 'Hotel lobby');
    selectOptionByText(dialog.querySelector('select[name="pickupVehicleType"]') as HTMLSelectElement, 'Taxi');
    selectOptionByText(dialog.querySelector('select[name="pickupDistanceId"]') as HTMLSelectElement, '<5km');
    setInputValue(dialog.querySelector('input[name="dropoffLocation"]') as HTMLInputElement, 'Station');
    selectOptionByText(dialog.querySelector('select[name="dropoffVehicleType"]') as HTMLSelectElement, 'Taxi');
    selectOptionByText(dialog.querySelector('select[name="dropoffDistanceId"]') as HTMLSelectElement, '5-10km');
    fixture.detectChanges();
  }

  function fillStepThreeHandoff(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const dialog = getDialog(compiled);
    setInputValue(dialog.querySelector('input[name="voucherNumber"]') as HTMLInputElement, 'VOUCH-1');
    setInputValue(dialog.querySelector('input[name="pickupLocation"]') as HTMLInputElement, 'Hotel lobby');
    selectOptionByText(dialog.querySelector('select[name="pickupVehicleType"]') as HTMLSelectElement, 'Taxi');
    selectOptionByText(dialog.querySelector('select[name="pickupDistanceId"]') as HTMLSelectElement, '<5km');
    const handoffRadio = dialog.querySelectorAll('input[name="drop-service-type"]')[1] as HTMLInputElement;
    handoffRadio.click();
    fixture.detectChanges();
    setInputValue(getDialog(compiled).querySelector('input[name="handoffText"]') as HTMLInputElement, 'Meet at the hotel lobby after confirmation');
    fixture.detectChanges();
  }

  function goToStepFour(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    goToStepThree(compiled, fixture);
    fillStepThreeDropoff(compiled, fixture);
    clickPrimaryAction(compiled, fixture);
  }

  function fillStepFour(compiled: HTMLElement, fixture: ReturnType<typeof createFixture>) {
    const dialog = getDialog(compiled);
    setInputValue(dialog.querySelector('input[name="guestEmail"]') as HTMLInputElement, 'guest@example.com');
    setInputValue(dialog.querySelector('input[name="dietaryRestrictions"]') as HTMLInputElement, 'No shellfish');
    const specialButton = dialog.querySelector('.special-request-options button') as HTMLButtonElement;
    specialButton.click();
    fixture.detectChanges();
  }

  it('should prompt for confirmation before cancelling an order', () => {
    const fixture = createFixture();
    const compiled = openActionMenu(fixture);

    const cancelAction = Array.from(compiled.querySelectorAll('.menu-item')).find((item) => item.textContent?.includes('Cancel')) as HTMLElement;
    cancelAction.click();
    fixture.detectChanges();

    const dialog = getDialog(compiled);
    expect(dialog.querySelector('.confirm-dialog')?.textContent).toContain('cancel this order');
    expect(dialog.querySelector('.confirm-dialog .request-order')?.textContent).toContain('Yes');
  });

  it('should invoke cancel when the confirmation dialog is accepted', () => {
    const fixture = createFixture();
    const compiled = openActionMenu(fixture);
    const view = fixture.componentInstance as any;

    spyOn(view, 'cancelOrder').and.callThrough();

    const cancelAction = Array.from(compiled.querySelectorAll('.menu-item')).find((item) => item.textContent?.includes('Cancel')) as HTMLElement;
    cancelAction.click();
    fixture.detectChanges();

    const yesButton = compiled.querySelector('.confirm-dialog .request-order') as HTMLButtonElement;
    yesButton.click();
    fixture.detectChanges();

    expect(view.cancelOrder).toHaveBeenCalledWith(1);
  });

  it('should navigate to the linked work details page when opening assignments', () => {
    const fixture = createFixture();
    const view = fixture.componentInstance as any;
    const routerSpy = spyOn(view.router, 'navigate');

    view.orderForAction = 1;
    view.goToAssignment();

    const req = httpMock.expectOne('/api/orders/1/work-id');
    expect(req.request.method).toBe('GET');
    req.flush(42);
    fixture.detectChanges();

    expect(routerSpy).toHaveBeenCalledWith(['/works', 42]);
  });

  it('should filter orders by reference text', async () => {
    const fixture = createFixture();
    const view = fixture.componentInstance as any;

    view.allOrders = [
      {
        id: 1,
        reseller: 'Gourmet Travel',
        pic: 'Mina Sato',
        ref1: 'REF-1',
        ref2: '',
        requestedDate: 'May 15, 2026',
        requestedAtRaw: '2026-05-15T10:00:00',
        offeredDateRaw: '2026-05-15T10:00:00',
        area: 'TOKYO',
        service: ['The Drunken Tiger'],
        type: 'P',
        targetDate: ['May 15, 2026'],
        pickup: '-/-',
        guests: '2/1',
        special: [],
        tr: 'warn',
        fee: '12,000',
        status: 'Requested',
        statusTone: 'info',
        statusCode: 'requested',
        guide: 'Unassigned',
      },
      {
        id: 2,
        reseller: 'Gourmet Travel',
        pic: 'Mina Sato',
        ref1: 'REF-2',
        ref2: '',
        requestedDate: 'May 16, 2026',
        requestedAtRaw: '2026-05-16T10:00:00',
        offeredDateRaw: '2026-05-16T10:00:00',
        area: 'TOKYO',
        service: ['Golden Barrel Pub'],
        type: 'S',
        targetDate: ['May 16, 2026'],
        pickup: '-/-',
        guests: '2/1',
        special: [],
        tr: 'warn',
        fee: '15,000',
        status: 'Offered',
        statusTone: 'warning',
        statusCode: 'offered',
        guide: 'Unassigned',
      },
    ];

    view.selectedFilterRef = 'REF-2';
    view.applySearchFilters();
    fixture.detectChanges();

    expect(view.filteredOrders.length).toBe(1);
    expect(view.filteredOrders[0].ref1).toBe('REF-2');
  });

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

  it('should enable Next on step one only after all visible fields are filled', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    let primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.textContent?.trim()).toBe('Next');
    expect(primaryButton.disabled).toBe(true);

    fillStepOne(compiled, fixture);
    primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.disabled).toBe(false);

    primaryButton.click();
    fixture.detectChanges();

    expect(getDialog(compiled).querySelector('#service-details-title')?.textContent).toContain('Service Details');
    expect(httpMock.match('/api/orders').length).toBe(0);
  });

  it('should use Next on steps two and three before Request Order on step four', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepTwo(compiled, fixture);

    let primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.textContent?.trim()).toBe('Next');
    expect(primaryButton.disabled).toBe(true);

    fillStepTwo(compiled, fixture);
    primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.disabled).toBe(false);
    primaryButton.click();
    fixture.detectChanges();

    expect(getDialog(compiled).querySelector('#additional-services-title')?.textContent).toContain('Additional Services');
    primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.textContent?.trim()).toBe('Next');
    expect(primaryButton.disabled).toBe(true);

    fillStepThreeDropoff(compiled, fixture);
    primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(primaryButton.disabled).toBe(false);
    primaryButton.click();
    fixture.detectChanges();

    primaryButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    expect(getDialog(compiled).querySelector('#guest-details-title')?.textContent).toContain('Guest Details');
    expect(primaryButton.textContent?.trim()).toBe('Request Order');
    expect(primaryButton.disabled).toBe(true);
    expect(httpMock.match('/api/orders').length).toBe(0);
  });

  it('should gate forward stepper navigation but allow going back', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    const stepTwoButton = getDialog(compiled).querySelector('.order-stepper li:nth-child(2) button') as HTMLButtonElement;
    const stepThreeButton = getDialog(compiled).querySelector('.order-stepper li:nth-child(3) button') as HTMLButtonElement;
    const stepFourButton = getDialog(compiled).querySelector('.order-stepper li:nth-child(4) button') as HTMLButtonElement;

    expect(stepTwoButton.disabled).toBe(true);
    expect(stepThreeButton.disabled).toBe(true);
    expect(stepFourButton.disabled).toBe(true);

    fillStepOne(compiled, fixture);
    fixture.detectChanges();
    expect(stepTwoButton.disabled).toBe(false);
    expect(stepThreeButton.disabled).toBe(true);

    stepTwoButton.click();
    fixture.detectChanges();
    expect(getDialog(compiled).querySelector('#service-details-title')).toBeTruthy();

    const stepOneButton = getDialog(compiled).querySelector('.order-stepper li:nth-child(1) button') as HTMLButtonElement;
    expect(stepOneButton.disabled).toBe(false);
    stepOneButton.click();
    fixture.detectChanges();
    expect(getDialog(compiled).querySelector('.new-order-form')).toBeTruthy();
  });

  it('should show service details on step two of the new order dialog', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepTwo(compiled, fixture);
    await fixture.whenStable();

    const dialog = getDialog(compiled);
    expect(dialog.querySelector('#service-details-title')?.textContent).toContain('Service Details');
    expect(dialog.querySelectorAll('.service-list-row').length).toBe(2);

    const eveningButton = Array.from(dialog.querySelectorAll('.time-slot-options button')).find(
      (button) => button.textContent?.trim() === 'Evening',
    ) as HTMLButtonElement;
    eveningButton.click();
    fixture.detectChanges();

    expect(eveningButton.classList).toContain('active');
  });

  it('should load service start times for the selected date and service', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepTwo(compiled, fixture);
    await fixture.whenStable();

    const dialog = getDialog(compiled);
    const targetDateInput = dialog.querySelector('input[name="targetDate"]') as HTMLInputElement;
    setInputValue(targetDateInput, '2026-06-01');
    httpMock.expectOne('/api/allotments/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    const selectButton = dialog.querySelector('.service-list-row button') as HTMLButtonElement;
    selectButton.click();
    httpMock.expectOne('/api/allotments/service/1/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();
    await fixture.whenStable();

    const timeButtons = dialog.querySelectorAll('.service-time-options button');
    expect(timeButtons.length).toBe(2);
    expect(timeButtons[0].textContent).toContain('9:00AM');
    expect((timeButtons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('should filter services by the selected available time slot', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepTwo(compiled, fixture);
    await fixture.whenStable();

    const dialog = getDialog(compiled);
    const targetDateInput = dialog.querySelector('input[name="targetDate"]') as HTMLInputElement;
    setInputValue(targetDateInput, '2026-06-01');
    httpMock.expectOne('/api/allotments/date/2026-06-01').flush(mockAllotments);
    fixture.detectChanges();

    const morningButton = Array.from(dialog.querySelectorAll('.time-slot-options button')).find(
      (button) => button.textContent?.trim() === 'Morning',
    ) as HTMLButtonElement;
    morningButton.click();
    fixture.detectChanges();

    const serviceRows = dialog.querySelectorAll('.service-list-row');
    expect(serviceRows.length).toBe(1);
    expect(serviceRows[0].textContent).toContain('The Drunken Tiger');
  });

  it('should show additional services on step three of the new order dialog', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepThree(compiled, fixture);
    await fixture.whenStable();

    const dialog = getDialog(compiled);
    expect(dialog.querySelector('#additional-services-title')?.textContent).toContain('Additional Services');
    expect(dialog.querySelector('input[placeholder="Enter Voucher Number"]')).toBeTruthy();
    expect(dialog.querySelectorAll('.service-extra-card').length).toBe(2);
    expect(dialog.querySelectorAll('.additional-fee').length).toBe(2);

    const handoffRadio = dialog.querySelectorAll('input[name="drop-service-type"]')[1] as HTMLInputElement;
    handoffRadio.click();
    fixture.detectChanges();

    expect(dialog.textContent).toContain('The hand off location and time will be confirmed later');
    expect(dialog.querySelector('input[placeholder="Enter Hand Off Details"]')).toBeTruthy();
    expect(dialog.querySelector('input[placeholder="Enter Drop-off Location"]')).toBeFalsy();
    expect(dialog.querySelectorAll('.service-extra-card')[1].querySelector('.additional-fee')).toBeFalsy();
  });

  it('should submit hand off as a distinct additional service', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepThree(compiled, fixture);
    fillStepThreeHandoff(compiled, fixture);
    clickPrimaryAction(compiled, fixture);
    fillStepFour(compiled, fixture);

    const requestButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
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

    const compiled = openNewOrderDialog(fixture);
    goToStepFour(compiled, fixture);
    await fixture.whenStable();

    const dialog = getDialog(compiled);
    expect(dialog.querySelector('#guest-details-title')?.textContent).toContain('Guest Details');
    expect(dialog.querySelector('input[placeholder="Enter Email"]')).toBeTruthy();
    expect(dialog.querySelectorAll('.guest-counter').length).toBe(2);
    expect(dialog.querySelectorAll('.special-request-options button').length).toBe(2);

    const requestButton = dialog.querySelector('.request-order') as HTMLButtonElement;
    expect(requestButton.textContent?.trim()).toBe('Request Order');
    expect(requestButton.disabled).toBe(true);

    fillStepFour(compiled, fixture);
    expect(requestButton.disabled).toBe(false);

    const increaseAdultsButton = dialog.querySelector('[aria-label="Increase adults"]') as HTMLButtonElement;
    increaseAdultsButton.click();
    fixture.detectChanges();

    expect(dialog.querySelector('.guest-counter strong')?.textContent?.trim()).toBe('03');
  });

  it('should hide the new order dialog after creating an order successfully', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const compiled = openNewOrderDialog(fixture);
    goToStepFour(compiled, fixture);
    fillStepFour(compiled, fixture);

    const routerNavigateSpy = spyOn((fixture.componentInstance as any).router, 'navigate');
    const requestButton = getDialog(compiled).querySelector('.request-order') as HTMLButtonElement;
    requestButton.click();

    httpMock.expectOne('/api/orders').flush(mockOrders[0]);
    httpMock.expectOne('/api/orders').flush(mockOrders);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerNavigateSpy).toHaveBeenCalledWith(['/orders', mockOrders[0].id]);
    expect(compiled.querySelector('[role="dialog"]')).toBeFalsy();
  });
});
