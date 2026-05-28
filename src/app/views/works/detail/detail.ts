import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type OrderStatus = 'Completed' | 'Active' | 'Scheduled';

export interface StatusOption {
  label: string;
  value: string;
}

export interface Order {
  reseller: string;
  originalAgent: string;
  ref1: string;
  guests: string;
  fee: string;
  special?: string;
  specialIcon?: string;
  specialNote?: string;
  specialLink?: string;
  status: OrderStatus;
}

export type GuideStatus = 'ACCEPTED' | 'PENDING' | 'DECLINED';

export interface Guide {
  name: string;
  phoneNumber: string;
  managerNote: string;
  role: string;
  calendarInvitation: boolean;
  status: GuideStatus;
}

export interface ItineraryItem {
  name: string;
  scheduleTime: string;
  phoneNumber: string;
  addedBy: string;
  addedAt: string;
  status?: string;
  notes?: string;
}

export interface Receipt {
  restaurant: string;
  notes: string;
  fee: number;
  tax: number;
  total: number;
  tNumber: string;
  passThrough: boolean;
  photo?: string;
  submittedBy: string;
  submittedAt: string;
}

@Component({
  selector: 'app-work-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class WorkDetail {
  statusOptions: StatusOption[] = [
    {
      label: 'All Statuses',
      value: 'ALL',
    },
    {
      label: 'Completed',
      value: 'Completed',
    },
    {
      label: 'Active',
      value: 'Active',
    },
    {
      label: 'Scheduled',
      value: 'Scheduled',
    },
  ];

  selectedStatus = 'ALL';

  orders: Order[] = [
    {
      reseller: 'EXO',
      originalAgent: 'James Anderson',
      ref1: 'TK-08053-1',
      guests: '5/0',
      fee: '¥90,488',
      special: 'VIP',
      specialIcon: '🍴',
      specialNote: 'View Notes',
      specialLink: '#',
      status: 'Completed',
    },

    {
      reseller: 'EXO',
      originalAgent: 'Emily Johnson',
      ref1: 'JPITAMI-M-9/7',
      guests: '2/1',
      fee: '¥90,036',
      special: '',
      specialIcon: '👜 ☕',
      specialNote: 'Order Details',
      specialLink: '#',
      status: 'Active',
    },
  ];

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Active':
        return 'active';
      case 'Scheduled':
        return 'scheduled';
      default:
        return '';
    }
  }

  get filteredOrders(): Order[] {
    if (this.selectedStatus === 'ALL') {
      return this.orders;
    }

    return this.orders.filter((order) => order.status === this.selectedStatus);
  }

  guides: Guide[] = [
    {
      name: 'Sophia Taylor',
      phoneNumber: '0987 654 321',
      managerNote: 'Main Guide',
      role: 'Leader',
      calendarInvitation: true,
      status: 'ACCEPTED',
    },
  ];

  receipts: Receipt[] = [
    {
      restaurant: 'Tokyo W',
      notes: 'Main Stop',
      fee: 1200,
      tax: 120,
      total: 1320,
      tNumber: 'T9X4B7L2Q1',
      passThrough: true,
      submittedBy: 'Emily Johnson',
      submittedAt: 'Tue, 31/March/2026 - 09:45 PM',
    },

    {
      restaurant: 'The Drunken Tiger',
      notes: 'Client Requested',
      fee: 850,
      tax: 85,
      total: 935,
      tNumber: 'H3K8M2P9D6',
      passThrough: false,
      submittedBy: 'Michael Brown',
      submittedAt: 'Wed, 01/April/2026 - 01:20 PM',
    },
  ];

  addGuide(): void {
    console.log('Add guide');
  }

  approveGuide(guide: Guide): void {
    console.log('Approve', guide);
  }

  rejectGuide(guide: Guide): void {
    console.log('Reject', guide);
  }

  removeGuide(guide: Guide): void {
    console.log('Remove', guide);
  }

  getGuideStatusClass(status: GuideStatus): string {
    switch (status) {
      case 'ACCEPTED':
        return 'accepted';
      case 'PENDING':
        return 'pending';
      case 'DECLINED':
        return 'declined';
      default:
        return '';
    }
  }

  itineraryList: ItineraryItem[] = [
    {
      name: 'Pick Up',
      scheduleTime: 'Sat, 04-Jan-25 - 5:00PM',
      phoneNumber: '--',
      addedBy: 'JAMIE',
      addedAt: 'Fri, 03-Jan-25 - 5:00PM',
      status: '--',
      notes: '--',
    },
  ];

  copyItinerary(): void {
    console.log('Copy itinerary');
  }

  openTourNotes(): void {
    console.log('Open tour notes');
  }

  addStop(): void {
    console.log('Add stop');
  }

  approveItineraryItem(item: ItineraryItem): void {
    console.log('Approve', item);
  }

  removeItineraryItem(item: ItineraryItem): void {
    console.log('Remove', item);
  }

  get totalVolume(): number {
    return this.receipts.reduce((sum, receipt) => sum + receipt.total, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  }

  openReceiptPhoto(receipt: Receipt): void {
    console.log('Open photo', receipt);
  }
}
