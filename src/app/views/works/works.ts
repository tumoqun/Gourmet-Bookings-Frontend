import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { PageResponse, Work, WorkFilter, WorkListResponse, WorkOrder, WorkService, WorkStatuses } from '../../services/work.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Area, Reseller, ResellerContact } from '../../services/api.service';

interface WorkFilterTab {
  label: string;
  count: string;
  active: boolean;
}

export enum WorkStatusClass {
  PENDING = 'status-pending',
  READY = 'status-ready',
  ACCEPTED = 'status-accepted',
  STARTED = 'status-started',
  REMINDER = 'status-reminder',
  PROBLEM = 'status-problem',
  REJECTED = 'status-rejected',
  PAID_DATE = 'status-paid-date',
  ENDED = 'status-ended',
  ACTIVE = 'status-active',
  SCHEDULED = 'status-scheduled',
  IN_PREP = 'status-in-prep',
  CANCELLED = 'status-cancelled',
  DELETED = 'status-deleted',
  REMOVED = 'status-deleted',
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

  activeCalendar = false;
  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();
  calendarWeekdays = [
    'Su',
    'Mo',
    'Tu',
    'We',
    'Th',
    'Fr',
    'Sa',
  ];
  calendarMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  guestsSummary = {
    totalAdults: 0,
    totalChildren: 0,
  };

  workData: PageResponse<WorkOrder> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    page: 0,
    totalAdultCount: 0,
    totalChildCount: 0
  };

  filters: WorkFilter = {};

  resellers: Reseller[] = [];
  resellerContacts: ResellerContact[] = [];
  areas: Area[] = [];
  statuses = WorkStatuses;

  constructor(
    private workService: WorkService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) { }

  filterTabs: WorkFilterTab[] = [
    { label: 'All Assignments', count: '0', active: true },
    { label: 'Changed Requests', count: '0', active: false },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadWorks(this.pageNumber, this.pageSize, this.filters);
    await this.loadResellers();
    await this.loadResellerContacts();
    await this.loadAreas();
  }

  openDateCalendar(event: MouseEvent): void {
    event.stopPropagation();
    this.activeCalendar = !this.activeCalendar;
    if (!this.filters.tourDate) {
      return;
    }
    const [year, month] =
      this.filters.tourDate.split('-').map(Number);
    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      this.calendarYear = year;
      this.calendarMonth = month - 1;
    }
  }

  changeCalendarMonth(monthDelta: number, event: MouseEvent): void {
    event.stopPropagation();
    const newMonth =
      this.calendarMonth + monthDelta;
    if (newMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else if (newMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth = newMonth;
    }
  }

  buildCalendarDays(year: number, month: number): number[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: number[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(0);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    while (days.length % 7 !== 0) {
      days.push(0);
    }
    return days;
  }

  selectCalendarDate(date: number, event: MouseEvent): void {
    event.stopPropagation();
    if (date <= 0) {
      return;
    }
    this.filters.tourDate =
      `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    this.activeCalendar = false;
  }

  isSelectedCalendarDate(date: number): boolean {
    if (date <= 0 || !this.filters.tourDate) {
      return false;
    }
    const currentDate =
      `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return this.filters.tourDate === currentDate;
  }

  async loadResellers(): Promise<void> {
    const resellers = await firstValueFrom(this.apiService.getResellers());
    this.resellers = resellers;
    this.cdr.detectChanges();
  }

  async loadResellerContacts(event?: Event): Promise<void> {
    const resellerContactsRes = await firstValueFrom(this.apiService.getResellerContacts());
    if (event) {
      const select = event.target as HTMLSelectElement;
      const resellerId = Number(select.value);
      this.filters.resellerId = resellerId;
      if (resellerId) {
        this.resellerContacts = resellerContactsRes.filter(c => Number(c.reseller?.id) === resellerId);
        this.filters.personInChargeId = resellerContactsRes.find(c => Number(c.reseller?.id) === resellerId)?.id;
      } else {
        this.resellerContacts = resellerContactsRes;
        this.filters.personInChargeId = undefined;
      }
    } else {
      this.resellerContacts = resellerContactsRes;
    }
    this.cdr.detectChanges();
  }

  async loadAreas(): Promise<void> {
    const areasRes = await firstValueFrom(this.apiService.getAreas());
    this.areas = areasRes;
    this.cdr.detectChanges();
  }

  applySearchFilters(): void {
    console.log('filters', this.filters)
    this.loadWorks(this.pageNumber, this.pageSize, this.filters);
  }

  clearSearchFilters(): void {
    this.filters = {};
    this.loadWorks(this.pageNumber, this.pageSize, this.filters);
    this.activeCalendar = false;
  }

  setActiveFilter(filterLabel: string): void {
    this.filterTabs = this.filterTabs.map((filter) => ({
      ...filter,
      active: filter.label === filterLabel,
    }));
  }

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  async loadWorks(page: number, size: number = this.pageSize, filters: WorkFilter): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      const workResponse = await firstValueFrom(this.workService.getWorks(page, size, filters));
      this.workData = workResponse;
    } catch (error) {
      console.error('Error loading works:', error);
      this.errorMessage = 'Error loading works';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getGuestSummaryForWork(work: WorkOrder): string {
    const totals = work.orders.reduce(
      (acc, order) => {
        acc.adults += order.adultCount ?? 0;
        acc.children += order.childCount ?? 0;
        return acc;
      },
      { adults: 0, children: 0 },
    );

    return `${totals.adults}/${totals.children}`;
  }

  handleRefesh(): void {
    this.loadWorks(this.pageNumber, this.pageSize, this.filters);
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
    this.loadWorks(page, this.pageSize, this.filters);
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
    this.loadWorks(this.pageNumber, this.pageSize, this.filters);
  }

  trackByWork(index: number, work: WorkOrder): number {
    return work.id ?? index;
  }

  viewWorkDetail(workId: number): void {
    this.router.navigate(['/works', workId]);
  }
}
