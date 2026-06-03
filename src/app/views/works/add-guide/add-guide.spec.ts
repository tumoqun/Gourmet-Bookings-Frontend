import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGuide } from './add-guide';

describe('AddGuide', () => {
  let component: AddGuide;
  let fixture: ComponentFixture<AddGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(AddGuide);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
