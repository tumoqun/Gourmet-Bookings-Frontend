import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkDetail } from './detail';

describe('WorkDetail', () => {
  let component: WorkDetail;
  let fixture: ComponentFixture<WorkDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
