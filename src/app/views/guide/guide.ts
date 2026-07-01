import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { GuideAssignment, GuideFilter, GuidePortalService } from '../../services/guide-portal.service';
import { AuthService } from '../../services/auth.service';
import { CapabilityService } from '../../services/capability.service';
import { FormsModule } from '@angular/forms';
import { GuideWorkStatuses } from '../../services/work.service';
import { firstValueFrom } from 'rxjs';
import { WorkStatusClass } from '../works/works';
import { Router } from '@angular/router';

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

  protected assignments: GuideAssignment[] = [];
  protected loading: boolean = true;
  protected error = signal<string | null>(null);

  statuses = GuideWorkStatuses;
  filters: GuideFilter = {};
  activeCalendar:boolean = false;
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

  constructor(
    private guidePortal: GuidePortalService,
    private cdr: ChangeDetectorRef,
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadAssignments();
  }

  handleRefesh(): void {
    this.loadAssignments();
  }

  openDateCalendar(event: MouseEvent): void {
    event.stopPropagation();
    this.activeCalendar = !this.activeCalendar;
    if (!this.filters.requestedDate) {
      return;
    }
    const [year, month] =
      this.filters.requestedDate.split('-').map(Number);
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
    this.filters.requestedDate =
      `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    this.activeCalendar = false;
  }

  isSelectedCalendarDate(date: number): boolean {
    if (date <= 0 || !this.filters.requestedDate) {
      return false;
    }
    const currentDate =
      `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return this.filters.requestedDate === currentDate;
  }

  getStatusClass(status: string): string {
    return WorkStatusClass[status.toUpperCase() as keyof typeof WorkStatusClass] || '';
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
    this.loadAssignments();
    this.activeCalendar = false;
  }

  clearSearchFilters(): void {
    this.filters = {};
    this.loadAssignments();
    this.activeCalendar = false;
  }

  async loadAssignments(): Promise<void> {
    this.loading = true;
    this.error.set(null);
    const res = await firstValueFrom(this.guidePortal.getAssignments(this.filters));
    this.assignments = res;
    this.loading = false;
    this.cdr.detectChanges();
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
    this.guidePortal.acceptAssignment(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected reject(id: number): void {
    this.guidePortal.rejectAssignment(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected startWork(id: number): void {
    this.guidePortal.startWork(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected endWork(id: number): void {
    this.guidePortal.endWork(id).subscribe({ next: () => this.loadAssignments() });
  }

  protected viewWorkDetail(id: number): void {
    this.router.navigate(['guide/work', id])
  }
}
