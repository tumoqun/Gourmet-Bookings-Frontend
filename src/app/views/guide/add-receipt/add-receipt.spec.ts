import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReceipt } from './add-receipt';

describe('AddReceipt', () => {
  let component: AddReceipt;
  let fixture: ComponentFixture<AddReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddReceipt],
    }).compileComponents();

    fixture = TestBed.createComponent(AddReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
