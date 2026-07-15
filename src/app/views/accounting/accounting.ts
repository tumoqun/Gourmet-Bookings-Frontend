import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import {
  AccountingService,
  AccountingItem,
  AccountingFilter,
  AssignmentAccountingDetail,
} from '../../services/accounting.service';
import { WorkService } from '../../services/work.service';
import { AccountingReview } from './accounting-review/accounting-review';

type AccountingTabId = 'all' | 'urgent' | 'guide-allowances' | 'pass-through';

interface AccountingTab {
  id: AccountingTabId;
  label: string;
  count?: number;
}

/** Flat view-model row consumed by the template */
interface AccountingRow {
  workId: number;
  guides: { name: string }[];
  reseller: string;
  ref1: string;
  service: string;
  ps: 'P' | 'S';
  guests: string;
  /** Formatted string: "Sat, 07 Dec 24 - 5:30PM" */
  targetDates: string;
  status: string;
  /** CSS class applied to .status-chip */
  statusTone: string;
  notes: string;
}

// Map backend work status strings → CSS tone classes
const STATUS_TONE_MAP: Record<string, string> = {
  scheduled:  'status-scheduled',
  offered:    'status-offered',
  accepted:   'status-accepted',
  in_prep:    'status-in-prep',
  ready:      'status-ready',
  started:    'status-started',
  reminder:   'status-reminder',
  ended:      'status-ended',
  closed:     'status-closed',
  paid_date:  'status-paid-date',
  cancelled:  'status-cancelled',
};

@Component({
  selector: 'app-accounting-view',
  imports: [CommonModule, FormsModule, AccountingReview],
  templateUrl: './accounting.html',
  styleUrl: './accounting.css',
})
export class AccountingView implements OnInit {
  protected readonly todayLabel = (() => {
    const d = new Date();
    return 'TODAY IS ' + d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).toUpperCase();
  })();

  protected readonly tabs: AccountingTab[] = [
    { id: 'all',              label: 'All Assignments' },
    { id: 'urgent',           label: 'Urgent' },
    { id: 'guide-allowances', label: 'Guide Allowance Requests' },
    { id: 'pass-through',     label: 'Pass Through Receipts' },
  ];

  protected activeTab: AccountingTabId = 'all';

  // ── filter state (kept for wiring later) ──────────────────────────────────
  protected readonly resellerOptions: string[] = [];
  protected readonly guideOptions: string[] = [];
  protected readonly statusOptions = [
    'All Statuses', 'Scheduled', 'Offered', 'Accepted',
    'In Prep', 'Ready', 'Started', 'Ended', 'Closed', 'Cancelled',
  ];

  protected reseller = '';
  protected ref = '';
  protected guideName = '';
  protected serviceName = '';
  protected tourDate = '';
  protected status = 'All Statuses';
  protected privateOnly = true;

  // ── table state ───────────────────────────────────────────────────────────
  protected rows: AccountingRow[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  protected selectedRows = 25;
  protected currentPage = 1;
  protected totalPages = 1;
  protected totalElements = 0;

  protected showReviewModal = false;
  protected reviewLoading = false;
  protected reviewError: string | null = null;
  protected reviewDetail: AssignmentAccountingDetail | null = null;
  protected reviewOrderStatus = '';

  constructor(
    private accountingService: AccountingService,
    private workService: WorkService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWorks();
  }

  // ── data loading ──────────────────────────────────────────────────────────

  protected loadWorks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: AccountingFilter = {
      ref: this.ref,
      guideName: this.guideName,
      serviceName: this.serviceName,
      tourDate: this.tourDate,
      status: this.status,
      isPrivate: this.privateOnly,
    };

    this.accountingService
      .getAccounting(filter, this.currentPage - 1, this.selectedRows)
      .subscribe({
        next: (response) => {
          try {
            this.totalElements = response.totalElements;
            this.totalPages = response.totalPages;
            this.rows = (response.content || []).map((item) => this.mapWorkToRow(item));
          } catch (e) {
            console.error('Error mapping rows', e);
            this.errorMessage = 'Data formatting error.';
          } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('API Error:', err);
          this.errorMessage = 'Failed to load accounting data. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── row mapping ───────────────────────────────────────────────────────────

  private mapWorkToRow(item: AccountingItem): AccountingRow {
    const reseller = item.resellerName ?? '-';
    const ref1 = item.ref1 ?? item.workNumber;
    const service = item.serviceName ?? '-';
    const ps: 'P' | 'S' = item.isPrivate ? 'P' : 'S';
    const guests = `${item.adultCount ?? 0}/${item.childCount ?? 0}`;

    // Target dates: date + optional start time (matches orders page format)
    const targetDates = item.tourDate
      ? `${this.formatDate(item.tourDate)}${item.tourStartTime ? ` - ${this.formatTime(item.tourStartTime)}` : ''}`
      : 'Not scheduled';

    const statusTone = this.getStatusTone(item.status);

    return {
      workId: item.workId,
      guides: (item.guideNames ?? []).map((name) => ({ name })),
      reseller,
      ref1,
      service,
      ps,
      guests,
      targetDates,
      status: this.formatStatus(item.status),
      statusTone,
      notes: item.notes ?? '-',
    };
  }

  // ── formatting helpers (same logic as orders page) ────────────────────────

  /**
   * Formats an ISO date string (YYYY-MM-DD) to "Sat, 07 Dec 24"
   * Uses noon local time to avoid timezone-shifting artefacts.
   */
  protected formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const parts = dateString.substring(0, 10).split('-');
    if (parts.length !== 3) return dateString;

    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day   = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;

    const date = new Date(year, month, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  /**
   * Formats a time string "HH:MM:SS" or "HH:MM" to "5:30PM".
   */
  protected formatTime(time?: string): string {
    if (!time) return '';
    const parts = time.split(':');
    const hh = Number(parts[0]);
    const mm = Number(parts[1] ?? 0);
    if (Number.isNaN(hh)) return time;
    const date = new Date();
    date.setHours(hh, mm, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
  }

  private formatStatus(raw?: string): string {
    if (!raw) return '-';
    const normalized = raw.toLowerCase().replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  protected getStatusTone(raw?: string): string {
    if (!raw) return 'status-ended';
    const key = raw.toLowerCase();
    return STATUS_TONE_MAP[key] ?? 'status-ended';
  }

  // ── tab / pagination ──────────────────────────────────────────────────────

  protected setTab(tab: AccountingTabId): void {
    this.activeTab = tab;
  }

  protected openReview(row: AccountingRow): void {
    this.showReviewModal = true;
    this.reviewLoading = true;
    this.reviewError = null;
    this.reviewDetail = null;
    this.reviewOrderStatus = '';

    this.workService.getWorkGuides(row.workId).pipe(
      switchMap((guides) => {
        const guide = guides[0];
        if (!guide) {
          throw new Error('No guide assigned to this work.');
        }

        return forkJoin({
          detail: this.accountingService.getAccountingDetail(row.workId, guide.guideId),
          orders: this.workService.getWorkOrders(row.workId, 'all').pipe(
            catchError(() => of([])),
          ),
        });
      }),
    ).subscribe({
      next: ({ detail, orders }) => {
        this.reviewDetail = detail;
        this.reviewOrderStatus = orders[0]?.status ?? '';
        this.reviewLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load accounting review', err);
        this.reviewError = err?.message ?? 'Failed to load accounting review.';
        this.reviewLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  protected closeReview(): void {
    this.showReviewModal = false;
    this.reviewLoading = false;
    this.reviewError = null;
    this.reviewDetail = null;
    this.reviewOrderStatus = '';
  }

  protected togglePrivate(): void {
    this.privateOnly = !this.privateOnly;
  }

  protected applyFilters(): void {
    this.currentPage = 1;
    this.loadWorks();
  }

  protected clearFilters(): void {
    this.reseller = '';
    this.ref = '';
    this.guideName = '';
    this.serviceName = '';
    this.tourDate = '';
    this.status = 'All Statuses';
    this.privateOnly = true;
    this.currentPage = 1;
    this.loadWorks();
  }

  protected topUpRequests(): void {
    // TODO: route to Top Up Requests
  }

  protected getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const pages: number[] = [];

    for (
      let i = Math.max(1, current - delta);
      i <= Math.min(total, current + delta);
      i++
    ) {
      pages.push(i);
    }

    return pages;
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadWorks();
  }

  protected goToFirstPage(): void    { this.goToPage(1); }
  protected goToPreviousPage(): void { this.goToPage(this.currentPage - 1); }
  protected goToNextPage(): void     { this.goToPage(this.currentPage + 1); }
  protected goToLastPage(): void     { this.goToPage(this.totalPages); }

  protected onRowsChange(size: number): void {
    this.selectedRows = size;
    this.currentPage = 1;
    this.loadWorks();
  }
}
