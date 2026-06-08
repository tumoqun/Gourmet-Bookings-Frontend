import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DEV_TEST_ACCOUNTS } from '../../models/auth.model';

@Component({
  selector: 'app-login-view',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginView implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    if (sessionStorage.getItem('gb_session_expired') === '1') {
      sessionStorage.removeItem('gb_session_expired');
      this.error.set('Your session expired. Please sign in again.');
    }

    if (this.auth.isLoggedIn()) {
      this.auth.navigateHome();
    }
  }

  protected email = '';
  protected password = '';
  protected remember = false;
  protected error = signal<string | null>(null);
  protected loading = signal(false);
  protected showDevAccounts = signal(false);
  protected readonly devAccounts = DEV_TEST_ACCOUNTS;

  protected onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.navigateHome();
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 401 && err?.statusText === 'Session expired') {
          this.error.set('Your session expired. Please sign in again.');
          return;
        }
        this.error.set(err?.error?.message || 'Invalid email or password.');
      },
    });
  }

  protected fillDevAccount(email: string): void {
    this.email = email;
    this.password = 'Gourmet123!';
    this.error.set(null);
  }

  protected toggleDevAccounts(): void {
    this.showDevAccounts.update((value) => !value);
  }
}
