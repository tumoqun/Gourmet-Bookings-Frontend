import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimePickerComponent } from './time-picker';

describe('TimePickerComponent', () => {
  let component: TimePickerComponent;
  let fixture: ComponentFixture<TimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(TimePicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
