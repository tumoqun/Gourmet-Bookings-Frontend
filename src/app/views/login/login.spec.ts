import { TestBed } from '@angular/core/testing';
import { LoginView } from './login';

describe('LoginView', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginView],
    }).compileComponents();
  });

  it('should create the view', () => {
    const fixture = TestBed.createComponent(LoginView);
    const view = fixture.componentInstance;
    expect(view).toBeTruthy();
  });

  it('should render the login screen', async () => {
    const fixture = TestBed.createComponent(LoginView);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Gourmet Bookings');
    expect(compiled.querySelector('form')?.textContent).toContain('Sign In');
  });
});
