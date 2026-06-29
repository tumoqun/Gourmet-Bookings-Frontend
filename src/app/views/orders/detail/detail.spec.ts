import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderDetail } from './detail';
import { ApiService } from '../../../services/api.service';

describe('OrderDetail guest editing', () => {
  let component: OrderDetail;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['updateOrderGuests']);
    const route = { snapshot: { paramMap: { get: () => '1' } } } as any;
    const router = { navigate: jasmine.createSpy('navigate') } as any;
    const cdr = { detectChanges: jasmine.createSpy('detectChanges') } as any;

    component = new OrderDetail(apiService, route, router, cdr);
  });

  it('opens the guest form with the selected guest prefilled', () => {
    component.guestMembers = [{
      name: 'Ada Lovelace',
      phone: '12345678',
      age: 36,
      gender: 'Female',
      allergies: 'None',
    } as any];

    component.openEditGuest(0);

    expect(component.isAddingGuest).toBeTrue();
    expect(component.editingGuestIndex).toBe(0);
    expect(component.newGuestFirstName).toBe('Ada');
    expect(component.newGuestLastName).toBe('Lovelace');
    expect(component.newGuestPhone).toBe('12345678');
    expect(component.newGuestAllergies).toBe('None');
  });

  it('updates an existing guest when saving from edit mode', () => {
    component.order = { id: 7 } as any;
    component.guestMembers = [{
      name: 'Ada Lovelace',
      phone: '12345678',
      age: 36,
      gender: 'Female',
      allergies: 'None',
    } as any];

    component.openEditGuest(0);
    component.newGuestFirstName = 'Grace';
    component.newGuestLastName = 'Hopper';
    component.newGuestPhone = '87654321';
    component.newGuestAge = 85;
    component.newGuestGender = 'Female';
    component.newGuestAllergies = 'Peanuts';

    apiService.updateOrderGuests.and.returnValue(of([{ 
      firstName: 'Grace',
      lastName: 'Hopper',
      phoneNumber: '87654321',
      age: 85,
      gender: 'Female',
      allergies: 'Peanuts',
    }] as any));

    component.confirmAddGuest();

    expect(component.guestMembers[0].name).toBe('Grace Hopper');
    expect(component.guestMembers[0].phone).toBe('87654321');
    expect(component.guestMembers[0].allergies).toBe('Peanuts');
    expect(component.isAddingGuest).toBeFalse();
  });
});
