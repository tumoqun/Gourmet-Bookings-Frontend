import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="toast-item" 
        [class.success]="toast.type === 'success'"
        [class.error]="toast.type === 'error'"
      >
        <span class="toast-icon">
          <svg *ngIf="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg *ngIf="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close message">✕</button>
      </div>
    </div>
  `,
  styleUrl: './toast-container.css'
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
