import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Area, Order, Service, ServiceType } from '../../services/api.service';

interface OrderRow {
  id?: number;
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
  statusCode: string;
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
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersView implements OnInit {
  protected isSidebarCollapsed = false;
  protected isNewOrderOpen = false;
  protected currentNewOrderStep = 1;
  protected adultGuests = 2;
  protected childGuests = 1;
  protected isLoading = false;
  protected errorMessage = '';

  protected readonly timeSlots = ['Any', 'Morning', 'Daytime', 'Evening', 'Night'];
  protected selectedTimeSlot = 'Any';
  protected selectedService?: Service;
  protected selectedArea?: Area;
  protected selectedServiceType?: ServiceType;
  protected services: Service[] = [];
  protected areas: Area[] = [];
  protected serviceTypes: ServiceType[] = [];

  protected navItems: NavigationItem[] = [
    { label: 'Catalog', icon: '/nav-icons/catalog.png', active: false },
    { label: 'Allotments', icon: '/nav-icons/allotments.png', active: false },
    { label: 'Orders', icon: '/nav-icons/orders.png', active: true },
    { label: 'Assignments', icon: '/nav-icons/assignments.png', active: false },
    { label: 'Job Accounting', icon: '/nav-icons/job-accounting.png', active: false },
    { label: 'Management', icon: '/nav-icons/management.png', active: false },
  ];

  protected filters: StatusFilter[] = [
    { label: 'All Orders', count: '0', active: true },
    { label: 'Guide Changes', count: '0', active: false },
    { label: 'Problem Reports', count: '0', active: false },
    { label: 'Tour Reports', count: '0', active: false },
    { label: 'Tentative', count: '0', active: false },
    { label: 'Pending', count: '0', active: false },
    { label: 'Requests', count: '0', active: false },
  ];

  protected orders: OrderRow[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadServices();
    this.loadAreas();
    this.loadServiceTypes();
  }

  protected loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getOrders().subscribe({
      next: (orders) => {
        Promise.resolve().then(() => {
          this.orders = orders.map((order) => this.mapOrderToRow(order));
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          this.errorMessage = 'Could not load orders from the backend.';
          this.orders = [];
          this.updateFilterCounts();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  protected loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: () => {
        this.errorMessage = this.errorMessage || 'Could not load services from the backend.';
        this.services = [];
        this.areas = [];
        this.serviceTypes = [];
      },
    });
  }

  protected loadAreas(): void {
    this.apiService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
      },
      error: () => {
        this.areas = this.uniqueById(this.services.map((service) => service.area).filter(Boolean));
      },
    });
  }

  protected loadServiceTypes(): void {
    this.apiService.getServiceTypes().subscribe({
      next: (serviceTypes) => {
        this.serviceTypes = serviceTypes;
      },
      error: () => {
        this.serviceTypes = this.uniqueById(this.services.map((service) => service.serviceType).filter(Boolean));
      },
    });
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  protected openNewOrderModal(): void {
    this.isNewOrderOpen = true;
    this.currentNewOrderStep = 1;
    this.errorMessage = '';
  }

  protected closeNewOrderModal(): void {
    this.isNewOrderOpen = false;
    this.currentNewOrderStep = 1;
  }

  protected setNewOrderStep(step: number): void {
    if (step > 4) {
      return;
    }

    this.currentNewOrderStep = step;
  }

  protected adjustGuestCount(type: 'adult' | 'child', change: number): void {
    if (type === 'adult') {
      this.adultGuests = Math.max(0, this.adultGuests + change);
      return;
    }

    this.childGuests = Math.max(0, this.childGuests + change);
  }

  protected formatGuestCount(count: number): string {
    return count.toString().padStart(2, '0');
  }

  protected selectTimeSlot(slot: string): void {
    this.selectedTimeSlot = slot;
  }

  protected selectService(service: Service): void {
    this.selectedService = service;
    this.selectedArea = service.area;
    this.selectedServiceType = service.serviceType;
  }

  protected setActiveNav(label: string): void {
    this.navItems = this.navItems.map((item) => ({
      ...item,
      active: item.label === label,
    }));
  }

  protected setActiveFilter(filterLabel: string): void {
    this.filters = this.filters.map((filter) => ({
      ...filter,
      active: filter.label === filterLabel,
    }));
  }

  protected createOrder(): void {
    this.errorMessage = '';

    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      orderChannel: 'frontend',
      isTentative: false,
      createdByName: 'Alexander Pierce',
      adultCount: this.adultGuests,
      childCount: this.childGuests,
      currencyCode: 'JPY',
      requestedAt: new Date().toISOString().slice(0, 19),
      orderServices: this.selectedService
        ? [
            {
              serviceId: this.selectedService.id,
              serviceNameSnapshot: this.selectedService.name,
              areaId: this.selectedService.area.id,
              serviceTypeId: this.selectedService.serviceType.id,
              isPrivate: false,
              timeSlotCode: this.selectedTimeSlot === 'Any' ? undefined : this.selectedTimeSlot.toUpperCase(),
              timezone: 'Asia/Tokyo',
            },
          ]
        : undefined,
    };

    this.isLoading = true;
    this.apiService.createOrder(orderData).subscribe({
      next: () => {
        this.closeNewOrderModal();
        this.loadOrders();
      },
      error: () => {
        this.errorMessage = 'Could not create the order in the backend.';
        this.isLoading = false;
      },
    });
  }

  protected submitOrder(orderId?: number): void {
    if (!orderId) {
      return;
    }

    this.apiService.submitOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not submit this order.';
      },
    });
  }

  protected cancelOrder(orderId?: number): void {
    if (!orderId) {
      return;
    }

    this.apiService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Could not cancel this order.';
      },
    });
  }

  protected trackByOrder(index: number, order: OrderRow): number | undefined {
    return order.id ?? index;
  }

  private mapOrderToRow(order: Order): OrderRow {
    const orderServices = order.orderServices ?? [];
    const targetDates = orderServices.length
      ? orderServices.map((orderService) =>
          orderService.targetDate
            ? `${this.formatDate(orderService.targetDate)}${orderService.startTime ? ` - ${this.formatTime(orderService.startTime)}` : ''}`
            : 'Not scheduled',
        )
      : ['Not scheduled'];

    return {
      id: order.id,
      reseller: order.reseller?.name ?? 'Direct Customer',
      pic: order.picContact?.name ?? order.createdByName ?? 'Unassigned',
      ref1: order.ref1 ?? order.orderNumber,
      ref2: order.ref2 ?? '',
      requestedDate: this.formatDate(order.requestedAt ?? order.createdAt),
      area: orderServices[0]?.area?.code ?? '-',
      service: orderServices.length
        ? orderServices.map((os) => {
            const name = os.service?.name ?? os.serviceNameSnapshot ?? 'Service';
            return os.isAdminModified ? `[modified]${name}` : name;
          })
        : ['Order only'],
      type: orderServices[0]?.isPrivate ? 'P' : 'S',
      targetDate: targetDates,
      pickup: this.getPickupInfo(order),
      guests: this.formatGuests(order.adultCount, order.childCount),
      special: this.getSpecialRequests(order),
      tr: this.getStatusIcon(order.status?.code ?? ''),
      fee: this.formatCurrency(order.totalFeeAmount),
      status: order.status?.label ?? order.status?.code ?? 'Requested',
      statusTone: this.getStatusTone(order.status?.code ?? ''),
      statusCode: order.status?.code ?? '',
      guide: order.guide ?? 'Unassigned',
    };
  }

  private formatDate(dateString?: string): string {
    if (!dateString) {
      return '-';
    }

    // Extract YYYY-MM-DD to avoid timezone shifting issues
    const parts = dateString.substring(0, 10).split('-');
    if (parts.length !== 3) {
      return dateString;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateString;
    }

    const date = new Date(year, month, day, 12, 0, 0); // Noon local time to avoid daylight saving issues

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  private formatTime(time?: string): string {
    if (!time) {
      return '';
    }
    // time expected as "HH:MM:SS" or "HH:MM"
    const parts = time.split(':');
    const hh = Number(parts[0]);
    const mm = Number(parts[1] ?? 0);
    if (Number.isNaN(hh)) {
      return time;
    }
    const date = new Date();
    date.setHours(hh, mm, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
  }

  private formatGuests(adults?: number, children?: number): string {
    return `${adults ?? 0}/${children ?? 0}`;
  }

  private formatCurrency(amount?: number): string {
    return (amount ?? 0).toLocaleString();
  }

  private getPickupInfo(order: Order): string {
    const pickup = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'PICKUP');
    const dropoff = order.additionalServices?.find((service) => service.kind.toUpperCase() === 'DROPOFF');

    const formatTime = (time?: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m}${ampm}`;
    };

    if (!pickup && !dropoff) return '-/-';

    const puTime = formatTime(pickup?.suggestedTime) || '-';
    if (pickup && !dropoff) return `${puTime}/${pickup.location || '-'}`;
    if (!pickup && dropoff) return `${formatTime(dropoff.suggestedTime) || '-'}/${dropoff.location || '-'}`;

    const doLoc = dropoff?.location || formatTime(dropoff?.suggestedTime) || '-';
    return `${puTime}/${doLoc}`;
  }

  private getSpecialRequests(order: Order): string[] {
    return order.specialRequests?.map((request) => {
      const code = request.code.toLowerCase();
      return code === 'wheel' ? 'h' : code;
    }) ?? [];
  }

  private getStatusIcon(statusCode: string): string {
    const normalizedStatus = statusCode.toLowerCase();
    const iconMap: Record<string, string> = {
      completed: 'check',
      confirmed: 'check',
      active: 'check',
      requested: 'warn',
      pending_offer: 'warn',
      cancelled: 'cross',
      tentative: 'circle',
    };

    return iconMap[normalizedStatus] ?? 'circle';
  }

  private getStatusTone(statusCode: string): string {
    const normalizedStatus = statusCode.toLowerCase();
    const toneMap: Record<string, string> = {
      completed: 'neutral',
      confirmed: 'success',
      active: 'success',
      requested: 'info',
      pending_offer: 'warning',
      cancelled: 'danger',
      tentative: 'info',
    };

    return toneMap[normalizedStatus] ?? 'neutral';
  }

  private updateFilterCounts(): void {
    // Count by canonical status code for reliable counts
    const statusCounts = this.orders.reduce(
      (acc, order) => {
        const code = order.statusCode.toLowerCase();
        if (code) {
          acc[code] = (acc[code] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    this.filters = this.filters.map((filter) => {
      if (filter.label === 'All Orders') {
        return { ...filter, count: this.orders.length.toString() };
      }

      if (filter.label === 'Requests') {
        return { ...filter, count: (statusCounts['requested'] ?? 0).toString() };
      }

      if (filter.label === 'Pending') {
        // backend code is PENDING_OFFER
        return { ...filter, count: (statusCounts['pending_offer'] ?? 0).toString() };
      }

      if (filter.label === 'Tentative') {
        return { ...filter, count: (statusCounts['tentative'] ?? 0).toString() };
      }

      return { ...filter, count: '0' };
    });
  }

  private uniqueById<T extends { id: number }>(items: T[]): T[] {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }
}
