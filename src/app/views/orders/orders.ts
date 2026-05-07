import { Component } from '@angular/core';

interface OrderRow {
  reseller: string;
  pic: string;
  ref1: string;
  ref2: string;
  requestedDate: string;
  area: string;
  service: string[];
  type: string;
  targetDate: string[];
  pickup: string;
  guests: string;
  special: string[];
  tr: string;
  fee: string;
  status: string;
  statusTone: string;
  guide: string;
}

interface NavigationItem {
  label: string;
  icon: string;
  active: boolean;
}

interface StatusFilter {
  label: string;
  count: string;
  active: boolean;
}

@Component({
  selector: 'app-orders-view',
  imports: [],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersView {
  protected isSidebarCollapsed = false;

  protected navItems: NavigationItem[] = [
    { label: 'Catalog', icon: '/nav-icons/catalog.png', active: false },
    { label: 'Allotments', icon: '/nav-icons/allotments.png', active: false },
    { label: 'Orders', icon: '/nav-icons/orders.png', active: true },
    { label: 'Assignments', icon: '/nav-icons/assignments.png', active: false },
    { label: 'Job Accounting', icon: '/nav-icons/job-accounting.png', active: false },
    { label: 'Management', icon: '/nav-icons/management.png', active: false },
  ];

  protected readonly filters: StatusFilter[] = [
    { label: 'All Orders', count: '43', active: true },
    { label: 'Guide Changes', count: '1', active: false },
    { label: 'Problem Reports', count: '41', active: false },
    { label: 'Tour Reports', count: '23', active: false },
    { label: 'Tentative', count: '17', active: false },
    { label: 'Pending', count: '14', active: false },
    { label: 'Requests', count: '50', active: false },
  ];

  protected readonly orders: OrderRow[] = [
    {
      reseller: 'EXO',
      pic: 'James Anderson',
      ref1: 'TK-08053-1',
      ref2: 'ACC-AWA03-1 2-oc',
      requestedDate: 'Sat, 07-Dec-24',
      area: 'TOKYO',
      service: ['The Izakaya', 'Tokyo V'],
      type: 'P',
      targetDate: ['Sat, 05-Dec-22 - 5:30PM', 'Sat, 07-Dec-24 - 5:30PM'],
      pickup: '-/-',
      guests: '6/0',
      special: ['vip', 'h'],
      tr: 'check',
      fee: '90,488',
      status: 'Completed',
      statusTone: 'neutral',
      guide: 'SOPHIA TAYLOR',
    },
    {
      reseller: 'Deomo Travel',
      pic: 'Emily Johnson',
      ref1: 'JPITAM-M-8/7',
      ref2: 'VOLLAMA-V9T',
      requestedDate: 'Sat, 04-Jan-25',
      area: 'TOKYO',
      service: ['Tokyo Underpass'],
      type: 'S',
      targetDate: ['Sat, 04-Jan-25 - 5:00PM'],
      pickup: '5:00PM/DO',
      guests: '2/1',
      special: ['bag', 'eye'],
      tr: 'cross',
      fee: '90,036',
      status: 'Active',
      statusTone: 'success',
      guide: 'EMILY JOHNSON',
    },
    {
      reseller: 'Deomo',
      pic: 'Michael Brown',
      ref1: 'NOLIRI322',
      ref2: 'KANANA',
      requestedDate: 'Fri, 15-Jan-25',
      area: 'TOKYO',
      service: ['Shimbashi'],
      type: 'P',
      targetDate: ['Fri, 15-Jan-25 - 3:30PM'],
      pickup: '1PM/-',
      guests: '2/0',
      special: ['vip'],
      tr: 'warn',
      fee: '5,300',
      status: 'Requested',
      statusTone: 'info',
      guide: 'MICHAEL BROWN',
    },
    {
      reseller: 'Deomo Japan',
      pic: 'Olivia Davis',
      ref1: 'JPTAM-JAM0030D',
      ref2: 'ACCM-JAM0030D',
      requestedDate: 'Sun, 26-Jan-25',
      area: 'TOKYO',
      service: ['Tokyo Underpass'],
      type: 'S',
      targetDate: ['Sun, 26-Jan-25 - 5:00PM'],
      pickup: '10:30AM/DO',
      guests: '5/0',
      special: ['fork', 'bag'],
      tr: 'box',
      fee: '90,036',
      status: 'Pending Offer',
      statusTone: 'warning',
      guide: 'OLIVIA DAVIS',
    },
    {
      reseller: 'Direct Customer',
      pic: 'Daniel Wilson',
      ref1: 'SPT-#1',
      ref2: 'SPT-#2',
      requestedDate: 'Mon, 19-May-25',
      area: 'TOKYO',
      service: ['The Ikebuyu'],
      type: 'S',
      targetDate: ['Mon, 19-May-25 - 6:00PM'],
      pickup: '-/-',
      guests: '4/0',
      special: ['link'],
      tr: 'circle',
      fee: '84,722',
      status: 'Cancelled',
      statusTone: 'danger',
      guide: 'DANIEL WILSON',
    },
  ];

  protected toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  protected setActiveNav(label: string): void {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: item.label === label,
    }));
  }
}
