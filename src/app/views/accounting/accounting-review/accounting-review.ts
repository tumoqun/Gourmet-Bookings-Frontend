import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AssignmentAccountingDetail } from '../../../services/accounting.service';
import { deriveOrderProgressStep, ORDER_STATUS_STEPS } from './accounting-review.constants';

@Component({
  selector: 'app-accounting-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accounting-review.html',
  styleUrl: './accounting-review.css',
})
export class AccountingReview {
  @Input() detail: AssignmentAccountingDetail | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  /** Order status label from the linked order, e.g. "Scheduled". */
  @Input() orderStatus = '';

  protected readonly statusSteps = ORDER_STATUS_STEPS;

  /** 0-based index for template binding. */
  protected get activeStepIndex(): number {
    return deriveOrderProgressStep(this.orderStatus) - 1;
  }

  protected get activeStatusLabel(): string {
    return this.orderStatus || this.statusSteps[this.activeStepIndex]?.label || '';
  }

  /** Progress fill width for the connector line (0–100%). */
  protected get progressFillPercent(): number {
    if (this.statusSteps.length <= 1) return 0;
    return (this.activeStepIndex / (this.statusSteps.length - 1)) * 100;
  }

  protected get tourTypeLabel(): string {
    const type = this.detail?.tourType?.toLowerCase();
    if (type === 'private') return 'PRIVATE';
    if (type === 'group') return 'GROUP';
    return this.detail?.tourType?.toUpperCase() ?? 'GROUP';
  }

  protected formatDateTime(value?: string | null): string {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return `${time} ${day}/${month}/${year}`;
  }

  protected formatMoney(value?: number | null): string {
    if (value == null) return '$ --';
    return `$ ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  protected formatHours(value?: number | null): string {
    if (value == null) return '--';
    return String(Number(value));
  }

  protected get primaryGuideName(): string {
    return this.detail?.guides?.[0]?.fullName?.trim() || '--';
  }

  protected get otherGuides() {
    return this.detail?.guides?.slice(1) ?? [];
  }

  protected primaryGuideAvatarUrl(): string {
    return this.guideAvatarUrl(this.detail?.guides?.[0]?.avatar);
  }

  protected guideAvatarUrl(avatar?: string | null): string {
    return avatar?.trim() || '/ui-icons/image-default.png';
  }
}
