import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

interface WorkFilter {
  label: string;
  count: string;
  active: boolean;
}

interface WorkRow {
  id?: number;
  reseller: string;
  area: string;
  service: string;
  pic: string;
  ref1: string;
  ps: string;
  tourStartDate: string;
  guests: string;
  status: string;
  guide: string;
}

export enum StatusClass {
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
}

@Component({
  selector: 'app-works',
  imports: [CommonModule],
  templateUrl: './works.html',
  styleUrl: './works.css',
  encapsulation: ViewEncapsulation.None,
})
export class Works {
  isLoading = true;
  protected errorMessage = '';
  protected readonly StatusClass = StatusClass;

  filters: WorkFilter[] = [
    { label: 'All Assignments', count: '0', active: true },
    { label: 'Changed Requests', count: '0', active: false },
  ];

  works: WorkRow[] = [
    {
      reseller: 'EXO',
      area: 'TOKYO',
      service: 'Tokyo W',
      pic: 'James Anderson',
      ref1: 'TK-08053-1',
      ps: 'P',
      tourStartDate: 'Sat, 07-Dec-24 - 5:30PM',
      guests: '5/0',
      status: 'ENDED',
      guide: 'SOPHIA TAYLOR',
    },

    {
      reseller: 'Deomo Travel',
      area: 'TOKYO',
      service: 'Tokyo Underpass',
      pic: 'Emily Johnson',
      ref1: 'JPITAMI-M-9/7',
      ps: 'S',
      tourStartDate: 'Sat, 04-Jan-25 - 5:00PM',
      guests: '2/1',
      status: 'ACTIVE',
      guide: 'EMILY JOHNSON',
    },

    {
      reseller: 'Deomo',
      area: 'TOKYO',
      service: 'Shimbashi',
      pic: 'Michael Brown',
      ref1: 'NOLIRL322',
      ps: 'P',
      tourStartDate: 'Fri, 15-Jan-25 - 3:30PM',
      guests: '2/0',
      status: 'SCHEDULED',
      guide: 'MICHAEL BROWN',
    },

    {
      reseller: 'Deomo Japan',
      area: 'TOKYO',
      service: 'Tokyo Underpass',
      pic: 'Olivia Davis',
      ref1: 'JPTAM-JAM0030D',
      ps: 'S',
      tourStartDate: 'Sun, 26-Jan-25 - 5:00PM',
      guests: '5/0',
      status: 'IN PREP',
      guide: 'OLIVIA DAVIS',
    },

    {
      reseller: 'Direct Customer',
      area: 'TOKYO',
      service: 'The Ikebuy',
      pic: 'Daniel Wilson',
      ref1: 'SPT-#1',
      ps: 'S',
      tourStartDate: 'Mon, 19-May-25 - 6:00PM',
      guests: '4/0',
      status: 'CANCELLED',
      guide: 'DANIEL WILSON',
    },
  ];

  setActiveFilter(filterLabel: string): void {
    this.filters = this.filters.map((filter) => ({
      ...filter,
      active: filter.label === filterLabel,
    }));
  }

  getStatusClass(status: string): string {
    return StatusClass[status as keyof typeof StatusClass] || '';
  }

  loadWorks = () => {
    console.log('load works');
  };

  protected trackByWork(index: number, work: WorkRow): number | undefined {
    return work.id ?? index;
  }
}
