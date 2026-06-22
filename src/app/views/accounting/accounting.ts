import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type AccountingTabId = 'all' | 'urgent' | 'guide-allowances' | 'pass-through';

interface AccountingTab {
  id: AccountingTabId;
  label: string;
  count?: number;
}

interface AccountingRow {
  guides: { name: string; meta?: string }[];
  reseller: string;
  ref1: string;
  service: string;
  ps: 'P' | 'S';
  guests: string;
  targetDates: string;
  status: string;
  statusTone: 'ended' | 'active' | 'scheduled' | 'in-prep' | 'cancelled';
  notes?: string;
}

@Component({
  selector: 'app-accounting-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.html',
  styleUrl: './accounting.css',
})
export class AccountingView {
  protected readonly todayLabel = 'TODAY IS THURSDAY, MARCH 12, 2026';

  protected readonly tabs: AccountingTab[] = [
    { id: 'all', label: 'All Assignments', count: 99 },
    { id: 'urgent', label: 'Urgent' },
    { id: 'guide-allowances', label: 'Guide Allowance Requests', count: 39 },
    { id: 'pass-through', label: 'Pass Through Receipts', count: 6 },
  ];

  protected activeTab: AccountingTabId = 'all';

  protected readonly resellerOptions = ['Exo', 'Daomo Travel', 'Daomo', 'Direct Customer'];
  protected readonly guideOptions = ['Sophia Taylor', 'Liam Carter', 'Noah Evans', 'William Scott', 'James Turner'];
  protected readonly statusOptions = ['All Statuses', 'Ended', 'Active', 'Scheduled', 'In Prep', 'Cancelled'];

  protected reseller = '';
  protected ref = '';
  protected guideName = '';
  protected serviceName = '';
  protected tourDate = '';
  protected status = 'All Statuses';
  protected privateOnly = true;

  protected readonly rows: AccountingRow[] = [
    {
      guides: [{ name: 'SOPHIA TAYLOR', meta: 'COMPLETED' }],
      reseller: 'EXO',
      ref1: 'TK-08053-1',
      service: 'Tokyo W',
      ps: 'P',
      guests: '5/0',
      targetDates: 'Sat, 07-Dec-24 - 5:30PM',
      status: 'Ended',
      statusTone: 'ended',
      notes: 'P  Rx3',
    },
    {
      guides: [
        { name: 'LIAM CARTER', meta: 'COMPLETED' },
        { name: 'AMELIA WALKER', meta: 'COMPLETED' },
      ],
      reseller: 'Daomo Travel',
      ref1: 'JPTAMI-M-9/7',
      service: 'Tokyo Underpass',
      ps: 'S',
      guests: '2/1',
      targetDates: 'Sat, 04-Jan-25 - 5:00PM',
      status: 'Active',
      statusTone: 'active',
      notes: 'R',
    },
    {
      guides: [
        { name: 'NOAH EVANS', meta: 'CLOSED' },
        { name: 'ISABELLA HALL' },
      ],
      reseller: 'Daomo',
      ref1: 'NO.IRL.322',
      service: 'Shimbashi',
      ps: 'P',
      guests: '2/0',
      targetDates: 'Fri, 15-Jan-25 - 3:30PM',
      status: 'Scheduled',
      statusTone: 'scheduled',
      notes: 'P  Rx4',
    },
    {
      guides: [
        { name: 'WILLIAM SCOTT', meta: 'COMPLETED' },
        { name: 'HENRY ADAMS', meta: 'COMPLETED' },
      ],
      reseller: 'Daomo Japan',
      ref1: 'JPTAM-JAM0030D',
      service: 'Tokyo Underpass',
      ps: 'S',
      guests: '6/0',
      targetDates: 'Sun, 26-Jan-25 - 5:00PM',
      status: 'In Prep',
      statusTone: 'in-prep',
      notes: 'R',
    },
    {
      guides: [{ name: 'JAMES TURNER', meta: 'CLOSED' }],
      reseller: 'Direct Customer',
      ref1: 'SPT-#1',
      service: 'The Ikebyu',
      ps: 'S',
      guests: '4/0',
      targetDates: 'Mon, 19-May-25 - 6:00PM',
      status: 'Cancelled',
      statusTone: 'cancelled',
      notes: 'Rx2',
    },
  ];

  protected selectedRows = 100;
  protected currentPage = 1;
  protected totalPages = 1;

  protected setTab(tab: AccountingTabId): void {
    this.activeTab = tab;
  }

  protected togglePrivate(): void {
    this.privateOnly = !this.privateOnly;
  }

  protected applyFilters(): void {
    // Design-only page for now; filtering will be wired to API later.
  }

  protected clearFilters(): void {
    this.reseller = '';
    this.ref = '';
    this.guideName = '';
    this.serviceName = '';
    this.tourDate = '';
    this.status = 'All Statuses';
    this.privateOnly = true;
  }

  protected topUpRequests(): void {
    // TODO: route to Top Up Requests when backend is ready
  }

  protected getGuideMetaClass(meta: string): string {
    const normalized = meta.trim().toUpperCase();
    if (normalized === 'COMPLETED') {
      return 'meta-completed';
    }
    if (normalized === 'CLOSED') {
      return 'meta-closed';
    }
    return 'meta-default';
  }
}

