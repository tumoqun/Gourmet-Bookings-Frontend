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
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Orders');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(5);
  });
});
