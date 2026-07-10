import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { GuideAssignment, GuideFilter, GuidePortalService, GuideSalaryEntry } from '../../services/guide-portal.service';
import { AuthService } from '../../services/auth.service';
import { CapabilityService } from '../../services/capability.service';
import { FormsModule } from '@angular/forms';
import { GuideWorkStatuses } from '../../services/work.service';
import { firstValueFrom } from 'rxjs';
import { WorkStatusClass } from '../works/works';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-guide-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './guide.html',
  styleUrl: './guide.css',
})
export class GuideView implements OnInit {
  private router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly capability = inject(CapabilityService);
  private readonly toast = inject(ToastService);

  protected assignments: GuideAssignment[] = [];
  protected loading: boolean = true;
  protected error = signal<string | null>(null);

  statuses = GuideWorkStatuses;
  filters: GuideFilter = {};
  activeCalendar: boolean = false;
  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();
  calendarSelectingFrom: boolean = true;
  fromDate: string = '';
  toDate: string = '';
  calendarWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
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

  protected showSalaryModal = false;
  protected salaryModalData: GuideSalaryEntry | null = null;
  protected salaryModalLoading = false;
  protected salaryModalError: string | null = null;

  constructor(
    private guidePortal: GuidePortalService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.fromDate = this.formatDateToString(new Date());
    this.toDate = this.formatDateToString(this.getDatePlus30Days());
    this.filters.fromDate = this.fromDate;
    this.filters.toDate = this.toDate;
    await this.loadAssignments();
  }

  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDatePlus30Days(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  handleRefesh(): void {
    this.loadAssignments();
  }

  openDateCalendar(event: MouseEvent): void {
    event.stopPropagation();
    this.activeCalendar = !this.activeCalendar;
    if (!this.fromDate) {
      return;
    }
    const [year, month] = this.fromDate.split('-').map(Number);
    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      this.calendarYear = year;
      this.calendarMonth = month - 1;
    }
  }

  changeCalendarMonth(monthDelta: number, event: MouseEvent): void {
    event.stopPropagation();
    const newMonth = this.calendarMonth + monthDelta;
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
    const selectedDate = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    if (this.calendarSelectingFrom) {
      this.fromDate = selectedDate;
      this.calendarSelectingFrom = false;
    } else {
      if (selectedDate < this.fromDate) {
        this.toDate = this.fromDate;
        this.fromDate = selectedDate;
      } else {
        this.toDate = selectedDate;
      }
      this.filters.fromDate = this.fromDate;
      this.filters.toDate = this.toDate;
      this.activeCalendar = false;
      this.calendarSelectingFrom = true;
      this.loadAssignments();
    }
  }

  isSelectedCalendarDate(date: number): boolean {
    if (date <= 0 || !this.fromDate) {
      return false;
    }
    const currentDate = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return currentDate >= this.fromDate && currentDate <= this.toDate;
  }

  isCalendarDateStart(date: number): boolean {
    if (date <= 0 || !this.fromDate) {
      return false;
    }
    const currentDate = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return currentDate === this.fromDate;
  }

  isCalendarDateEnd(date: number): boolean {
    if (date <= 0 || !this.toDate) {
      return false;
    }
    const currentDate = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return currentDate === this.toDate;
  }

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
  }

  onStatusChange(status: string): void {
    if (status === 'undefined') {
      delete this.filters.status;
    } else {
      this.filters.status = status;
    }
    this.loadAssignments();
  }

  onCheckboxChange(): void {
    if (this.filters.isNewOffered) {
      this.filters.status = 'undefined';
      this.filters.isNewOffered = false;
    } else {
      this.filters.status = 'OFFERED';
      this.filters.isNewOffered = true;
    }
    this.loadAssignments();
  }

  applySearchFilters(): void {
    this.filters.fromDate = this.fromDate;
    this.filters.toDate = this.toDate;
    this.loadAssignments();
    this.activeCalendar = false;
  }

  clearSearchFilters(): void {
    this.filters = {
      fromDate: this.formatDateToString(new Date()),
      toDate: this.formatDateToString(this.getDatePlus30Days()),
    };
    this.fromDate = this.formatDateToString(new Date());
    this.toDate = this.formatDateToString(this.getDatePlus30Days());
    this.calendarSelectingFrom = true;
    this.loadAssignments();
    this.activeCalendar = false;
  }

  async loadAssignments(): Promise<void> {
    this.loading = true;
    this.error.set(null);
    const res = await firstValueFrom(this.guidePortal.getAssignments(this.filters));
    this.assignments = res.map(assignment => {
      if (assignment.workStatus && assignment.workStatus.toUpperCase() === 'SCHEDULED') {
        return {
          ...assignment,
          workStatus: 'OFFERED'
        };
      }
      return assignment;
    });
    this.loading = false;
    this.cdr.detectChanges();
  }

  async loadSalaryEntry(workId: number, guideId: number): Promise<any> {
    try {
      const res = await firstValueFrom(this.guidePortal.getGuideSalaryEntry(workId, guideId));
      return res;
    } catch (error) {
      console.error('Error loading salary entry:', error);
      this.error.set('Failed to load salary entry.');
      return null;
    } finally {
      this.cdr.detectChanges();
    }
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  formatCurrency(value?: number): string {
    if (value == null) {
      return '--';
    }
    return value.toLocaleString('vi-VN');
  }

  protected accept(id: number): void {
    this.guidePortal.acceptAssignment(id).subscribe({
      next: () => {
        this.toast.showSuccess('Assignment accepted successfully!');
        this.loadAssignments();
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to accept assignment.');
        console.error(err);
      }
    });
  }

  protected reject(id: number): void {
    this.guidePortal.rejectAssignment(id).subscribe({
      next: () => {
        this.toast.showSuccess('Assignment rejected successfully!');
        this.loadAssignments();
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to reject assignment.');
        console.error(err);
      }
    });
  }

  protected startWork(id: number): void {
    this.guidePortal.startWork(id).subscribe({
      next: () => {
        this.toast.showSuccess('Work started successfully!');
        this.loadAssignments();
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to start work.');
        console.error(err);
      }
    });
  }

  protected endWork(id: number): void {
    this.guidePortal.endWork(id).subscribe({
      next: () => {
        this.toast.showSuccess('Work ended successfully!');
        this.loadAssignments();
      },
      error: (err) => {
        this.toast.showError(err?.error?.message || 'Failed to end work.');
        console.error(err);
      }
    });
  }

  protected viewWorkDetail(id: number): void {
    this.router.navigate(['guide/work', id]);
  }

  protected openSalaryEntry(work: GuideAssignment): void {
    const guideId = this.auth.currentUser()?.guideId;
    if (!guideId) {
      this.salaryModalError = 'Guide ID not found.';
      this.salaryModalData = null;
      this.salaryModalLoading = false;
      this.showSalaryModal = true;
      return;
    }

    this.salaryModalError = null;
    this.salaryModalData = null;
    this.salaryModalLoading = true;
    this.showSalaryModal = true;

    this.loadSalaryEntry(work.workId, guideId).then((salaryData) => {
      if (salaryData) {
        this.salaryModalData = salaryData;
      } else {
        this.salaryModalError = 'Failed to load salary entry.';
      }
    }).finally(() => {
      this.salaryModalLoading = false;
      this.cdr.detectChanges();
    });
  }

  protected closeSalaryEntry(): void {
    this.showSalaryModal = false;
    this.salaryModalData = null;
    this.salaryModalLoading = false;
    this.salaryModalError = null;
  }
}
