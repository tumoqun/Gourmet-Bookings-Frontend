import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { PageResponse, Work, WorkListResponse, WorkOrder, WorkService } from '../../services/work.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface WorkFilter {
  label: string;
  count: string;
  active: boolean;
}

export enum WorkStatusClass {
  READY = 'status-ready',
  ACCEPTED = 'status-accepted',
  STARTED = 'status-started',
  REMINDER = 'status-reminder',
  PROBLEM = 'status-problem',
  REJECTED = 'status-rejected',
  'PAID DATE' = 'status-paid-date',
  ENDED = 'status-ended',
  ACTIVE = 'status-active',
  SCHEDULED = 'status-scheduled',
  'IN PREP' = 'status-in-prep',
  CANCELLED = 'status-cancelled',
  DELETED = 'status-deleted',
  CLOSED = 'status-closed',
  CONFIRMED = 'status-confirmed',
  COMPLETED = 'status-completed',
}

@Component({
  selector: 'app-works',
  imports: [CommonModule, FormsModule],
  templateUrl: './works.html',
  styleUrl: './works.css',
  encapsulation: ViewEncapsulation.None,
})
export class Works {
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  readonly StatusClass = WorkStatusClass;

  pageSize = 10;
  pageNumber = 0;
  totalPages = 0;
  totalElements = 0;
  pageNumbers: number[] = [];
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  guestsSummary = {
    totalAdults: 0,
    totalChildren: 0,
  };

  workData: PageResponse<WorkOrder> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    last: true,
    size: 10,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    numberOfElements: 0,
    first: true,
    empty: true,
  };

  constructor(
    private workService: WorkService,
    private cdr: ChangeDetectorRef,
  ) {}

  filters: WorkFilter[] = [
    { label: 'All Assignments', count: '0', active: true },
    { label: 'Changed Requests', count: '0', active: false },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadWorks(this.pageNumber, this.pageSize);
    await this.getGuestSummary();
  }

  setActiveFilter(filterLabel: string): void {
    this.filters = this.filters.map((filter) => ({
      ...filter,
      active: filter.label === filterLabel,
    }));
  }

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  async loadWorks(page: number, size: number = this.pageSize): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      const workResponse = await firstValueFrom(this.workService.getWorks(page, size));
      this.workData = workResponse;
    } catch (error) {
      console.error('Error loading works:', error);
      this.errorMessage = 'Error loading works';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get visiblePages(): number[] {
    // chỉ có 1 page
    if (this.totalPages <= 1) {
      return [0];
    }
    // page đầu -> hiện 1,2
    if (this.pageNumber === 0) {
      return [0, 1];
    }
    // page cuối -> hiện page trước + page hiện tại
    if (this.pageNumber === this.totalPages - 1) {
      return [this.pageNumber - 1, this.pageNumber];
    }
    // các page ở giữa -> hiện current + next
    return [this.pageNumber, this.pageNumber + 1];
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }

    this.pageNumber = page;
    this.loadWorks(page, this.pageSize);
  }

  goToFirstPage(): void {
    this.goToPage(0);
  }

  goToPreviousPage(): void {
    this.goToPage(this.pageNumber - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.pageNumber + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages - 1);
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = value;
    // reset về page đầu
    this.pageNumber = 0;
    this.loadWorks(this.pageNumber, this.pageSize);
  }

  trackByWork(index: number, work: WorkOrder): number {
    return work.id ?? index;
  }

  async getGuestSummary(): Promise<void> {
    try {
      const summary = await firstValueFrom(this.workService.getGuestSummary());
      this.guestsSummary = { ...summary };
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching guest summary:', error);
    }
  }

  viewWorkDetail(workId: number): void {
    this.router.navigate(['/works', workId]);
  }
}
