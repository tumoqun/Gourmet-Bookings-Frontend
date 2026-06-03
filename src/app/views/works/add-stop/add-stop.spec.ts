import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStop } from './add-stop';

describe('AddStop', () => {
  let component: AddStop;
  let fixture: ComponentFixture<AddStop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStop],
    }).compileComponents();

    fixture = TestBed.createComponent(AddStop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
