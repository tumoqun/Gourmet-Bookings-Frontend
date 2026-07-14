import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-confirm-password-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-password.html',
  styleUrl: './confirm-password.css',
})
export class ConfirmPasswordView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  protected token = '';
  protected password = '';
  protected confirmPassword = '';
  protected error = signal<string | null>(null);
  protected success = signal<string | null>(null);
  protected loading = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error.set('Invalid or missing confirmation token.');
      this.toast.showError('Invalid or missing confirmation token.');
    }
  }

  protected onSubmit(): void {
    if (!this.token) {
      this.error.set('Cannot submit without a valid confirmation token.');
      return;
    }

    if (!this.password || !this.confirmPassword) {
      this.error.set('Both password fields are required.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters long.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.userService.confirmPassword({ token: this.token, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Password confirmed successfully! Redirecting to login...');
        this.toast.showSuccess('Password confirmed successfully!');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.loading.set(false);
        const errMsg = err?.error?.message || 'Failed to confirm password. The link might be expired.';
        this.error.set(errMsg);
        this.toast.showError(errMsg);
      },
    });
  }
}
