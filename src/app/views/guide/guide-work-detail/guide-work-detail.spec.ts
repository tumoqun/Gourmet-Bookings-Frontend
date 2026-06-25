import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideWorkDetail } from './guide-work-detail';

describe('GuideWorkDetail', () => {
  let component: GuideWorkDetail;
  let fixture: ComponentFixture<GuideWorkDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuideWorkDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(GuideWorkDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
